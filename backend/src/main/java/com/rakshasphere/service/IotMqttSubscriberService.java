package com.rakshasphere.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rakshasphere.dto.IotTelemetryDto;
import com.rakshasphere.health.MqttHealthIndicator;
import com.rakshasphere.model.entity.IotDevice;
import com.rakshasphere.model.entity.IotTelemetryLog;
import com.rakshasphere.repository.IotDeviceRepository;
import com.rakshasphere.repository.IotTelemetryLogRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class IotMqttSubscriberService implements MqttCallbackExtended {

    private static final Logger log = LoggerFactory.getLogger(IotMqttSubscriberService.class);
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final IotDeviceRepository iotDeviceRepository;
    private final IotTelemetryLogRepository iotTelemetryLogRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Value("${SPRING_REDIS_HOST:localhost}")
    private String mqttHost;

    @Value("${MQTT_PORT:1883}")
    private int mqttPort;

    private MqttClient mqttClient;

    public IotMqttSubscriberService(IotDeviceRepository iotDeviceRepository,
                                    IotTelemetryLogRepository iotTelemetryLogRepository) {
        this.iotDeviceRepository = iotDeviceRepository;
        this.iotTelemetryLogRepository = iotTelemetryLogRepository;
    }

    @PostConstruct
    public void postConstruct() {
        log.info("📡 IotMqttSubscriberService bean initialized in Spring Context (Target: tcp://{}:{})", mqttHost, mqttPort);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady(ApplicationReadyEvent event) {
        String brokerUrl = "tcp://" + mqttHost + ":" + mqttPort;
        String clientId = "backend_iot_consumer_" + UUID.randomUUID().toString().substring(0, 8);

        try {
            mqttClient = new MqttClient(brokerUrl, clientId, new MemoryPersistence());
            mqttClient.setCallback(this);

            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(10);
            options.setKeepAliveInterval(60);
            options.setUserName("admin");

            log.info("Connecting Spring Boot MQTT Consumer to broker at {}...", brokerUrl);
            mqttClient.connect(options);
        } catch (MqttException e) {
            log.warn("Deferred MQTT Subscriber initialization (broker may be starting up): {}", e.getMessage());
        }
    }

    @Override
    public void connectComplete(boolean reconnect, String serverURI) {
        log.info("✅ Spring Boot MQTT Consumer connected to Mosquitto at {} (reconnect={})", serverURI, reconnect);
        try {
            mqttClient.subscribe("rakshasphere/devices/+/telemetry", 1);
            mqttClient.subscribe("rakshasphere/devices/+/status", 1);
            log.info("Subscribed to MQTT topics: rakshasphere/devices/+/telemetry, rakshasphere/devices/+/status");
        } catch (MqttException e) {
            log.error("Failed to subscribe to MQTT topics: {}", e.getMessage());
        }
    }

    @Override
    public void connectionLost(Throwable cause) {
        log.warn("⚠️ Spring Boot MQTT Consumer connection lost: {}", cause != null ? cause.getMessage() : "Unknown cause");
    }

    @Override
    public void messageArrived(String topic, MqttMessage message) {
        String payload = new String(message.getPayload(), StandardCharsets.UTF_8);
        log.debug("📩 [MQTT Telemetry Received] Topic: {} | Payload: {}", topic, payload);

        // Record telemetry receipt timestamp in MqttHealthIndicator
        MqttHealthIndicator.recordIotTelemetryReceived();

        try {
            if (topic.endsWith("/telemetry")) {
                IotTelemetryDto dto = objectMapper.readValue(payload, IotTelemetryDto.class);
                String deviceId = dto.getDeviceId() != null ? dto.getDeviceId() : "UNKNOWN";

                // Persist/Update IotDevice state in MySQL
                IotDevice device = iotDeviceRepository.findById(deviceId)
                        .orElseGet(() -> IotDevice.builder()
                                .deviceId(deviceId)
                                .createdAt(LocalDateTime.now())
                                .build());

                device.setStatus("ONLINE");
                device.setCpuUsagePct(dto.getCpuUsagePct());
                device.setMemoryUsagePct(dto.getMemoryUsagePct());
                if (dto.getNetworkStats() != null) {
                    device.setActiveSockets(dto.getNetworkStats().getActiveSockets());
                }
                if (dto.getConnectionQuality() != null) {
                    device.setLatencyMs(dto.getConnectionQuality().getLatencyMs());
                }
                device.setLastHeartbeat(LocalDateTime.now());
                iotDeviceRepository.save(device);

                // Persist telemetry sample log in MySQL
                IotTelemetryLog telemetryLog = IotTelemetryLog.builder()
                        .deviceId(deviceId)
                        .cpuUsagePct(dto.getCpuUsagePct())
                        .memoryUsagePct(dto.getMemoryUsagePct())
                        .activeSockets(dto.getNetworkStats() != null ? dto.getNetworkStats().getActiveSockets() : null)
                        .latencyMs(dto.getConnectionQuality() != null ? dto.getConnectionQuality().getLatencyMs() : null)
                        .rawPayload(payload)
                        .timestamp(LocalDateTime.now())
                        .build();
                iotTelemetryLogRepository.save(telemetryLog);

                log.info("📥 [IoT Telemetry Persisted] Device: {} | CPU: {}% | RAM: {}% | Sockets: {}",
                        deviceId, dto.getCpuUsagePct(), dto.getMemoryUsagePct(),
                        dto.getNetworkStats() != null ? dto.getNetworkStats().getActiveSockets() : "N/A");
            } else if (topic.endsWith("/status")) {
                log.info("📢 [IoT Device Status Update] Topic: {} | Payload: {}", topic, payload);
                try {
                    Map<String, Object> statusMap = objectMapper.readValue(payload, Map.class);
                    String deviceId = (String) statusMap.get("deviceId");
                    String status = (String) statusMap.get("status");
                    if (deviceId != null && status != null) {
                        IotDevice device = iotDeviceRepository.findById(deviceId).orElse(null);
                        if (device != null) {
                            device.setStatus(status);
                            device.setLastHeartbeat(LocalDateTime.now());
                            iotDeviceRepository.save(device);
                            log.info("📌 Updated IotDevice status in MySQL: {} -> {}", deviceId, status);
                        }

                        // Broadcast status change event over STOMP WebSocket
                        if (messagingTemplate != null) {
                            Map<String, Object> event = new HashMap<>();
                            event.put("eventType", "IOT_DEVICE_STATUS");
                            event.put("deviceId", deviceId);
                            event.put("status", status);
                            event.put("timestamp", LocalDateTime.now().toString());
                            messagingTemplate.convertAndSend("/topic/alerts", event);
                        }
                    }
                } catch (Exception ex) {
                    log.error("Failed to parse IoT status message: {}", ex.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed to parse and persist incoming IoT MQTT message payload on topic {}: {}", topic, e.getMessage(), e);
        }
    }

    @Override
    public void deliveryComplete(IMqttDeliveryToken token) {
        // Consumer only
    }

    @PreDestroy
    public void cleanup() {
        if (mqttClient != null && mqttClient.isConnected()) {
            try {
                mqttClient.disconnect();
                mqttClient.close();
                log.info("Spring Boot MQTT Consumer disconnected gracefully.");
            } catch (Exception e) {
                log.error("Error disconnecting MQTT client: {}", e.getMessage());
            }
        }
    }
}
