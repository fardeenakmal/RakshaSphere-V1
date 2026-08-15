package com.rakshasphere.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;

import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.concurrent.atomic.AtomicLong;

@Component("mqttBroker")
public class MqttHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(MqttHealthIndicator.class);
    private static final AtomicLong lastIotTelemetryTimestamp = new AtomicLong(System.currentTimeMillis());

    @Value("${SPRING_REDIS_HOST:localhost}")
    private String mqttHost;

    @Value("${MQTT_PORT:1883}")
    private int mqttPort;

    public static void recordIotTelemetryReceived() {
        lastIotTelemetryTimestamp.set(System.currentTimeMillis());
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        boolean brokerReachable = false;
        long latencyMs = 0;

        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(mqttHost, mqttPort), 1500);
            brokerReachable = true;
            latencyMs = System.currentTimeMillis() - start;
        } catch (Exception e) {
            latencyMs = System.currentTimeMillis() - start;
            log.warn("Mosquitto MQTT broker connection failed: {}", e.getMessage());
        }

        long timeSinceLastIotMsg = System.currentTimeMillis() - lastIotTelemetryTimestamp.get();
        boolean iotAgentActive = timeSinceLastIotMsg < 300000; // Received telemetry within last 5 minutes

        if (brokerReachable && iotAgentActive) {
            return Health.status(CustomHealthStatuses.HEALTHY)
                    .withDetail("mosquittoBroker", "HEALTHY")
                    .withDetail("iotAgent", "HEALTHY")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("lastIotTelemetrySecAgo", timeSinceLastIotMsg / 1000)
                    .build();
        } else if (brokerReachable) {
            return Health.status(CustomHealthStatuses.DEGRADED)
                    .withDetail("mosquittoBroker", "HEALTHY")
                    .withDetail("iotAgent", "DOWN")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("lastIotTelemetrySecAgo", timeSinceLastIotMsg / 1000)
                    .withDetail("issue", "MQTT broker is reachable but IoT edge daemon has not sent recent heartbeats")
                    .build();
        } else {
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("mosquittoBroker", "DOWN")
                    .withDetail("iotAgent", "UNKNOWN")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("error", "Mosquitto broker on " + mqttHost + ":" + mqttPort + " is unreachable")
                    .build();
        }
    }
}
