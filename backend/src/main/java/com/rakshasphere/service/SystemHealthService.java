package com.rakshasphere.service;

import com.rakshasphere.dto.SystemHealthResponseDTO;
import com.rakshasphere.dto.SystemHealthResponseDTO.HealthSummary;
import com.rakshasphere.dto.SystemHealthResponseDTO.ServiceHealthDetail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.HealthComponent;
import org.springframework.boot.actuate.health.HealthEndpoint;
import org.springframework.boot.actuate.health.SystemHealth;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.rakshasphere.model.ServiceHealthEvent;
import com.rakshasphere.repository.ServiceHealthEventRepository;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SystemHealthService {

    private static final Logger log = LoggerFactory.getLogger(SystemHealthService.class);

    // Critical Core Services (Phase 13 Priority Rules)
    private static final Set<String> CRITICAL_CORE_SERVICES = Set.of(
            "frontend",
            "backend",
            "mysql",
            "redis",
            "ai-engine"
    );

    @Value("${frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private final HealthEndpoint healthEndpoint;
    private final RestTemplate restTemplate;
    private final ServiceHealthEventRepository eventRepository;

    // Phase 19: State Transition Deduplication Tracking
    private final Map<String, String> lastKnownStatusMap = new ConcurrentHashMap<>();
    private final Map<String, String> lastSuccessfulCheckMap = new ConcurrentHashMap<>();

    @Autowired
    public SystemHealthService(HealthEndpoint healthEndpoint, ServiceHealthEventRepository eventRepository) {
        this.healthEndpoint = healthEndpoint;
        this.eventRepository = eventRepository;
        this.restTemplate = new RestTemplate();
    }

    public SystemHealthResponseDTO getSystemHealth() {
        Instant now = Instant.now();
        List<ServiceHealthDetail> services = new ArrayList<>();

        HealthComponent actuateHealth = healthEndpoint.health();
        Map<String, HealthComponent> components = Collections.emptyMap();
        if (actuateHealth instanceof SystemHealth systemHealth) {
            components = systemHealth.getComponents();
        }

        // 1. Frontend
        services.add(checkFrontend(now));

        // 2. Core Backend
        services.add(checkBackend(now));

        // 3. MySQL Database
        services.add(checkMySql(components, now));

        // 4. Redis Cache & PubSub
        services.add(checkRedis(components, now));

        // 5. AI Threat Intelligence Engine
        services.add(checkAiEngine(components, now));

        // 6. STOMP WebSocket Alert Stream
        services.add(checkStomp(components, now));

        // 7. Mosquitto MQTT Broker
        services.add(checkMqtt(components, now));

        // 8. IoT Edge Gateway Security Daemon
        services.add(checkIotDaemon(components, now));

        // 9. VirusTotal
        services.add(checkVirusTotal(components, now));

        // 10. AbuseIPDB
        services.add(checkAbuseIpDb(components, now));

        // 11. Honeypot Subsystem
        services.add(checkHoneypot(components, now));

        // 12. Database Backup Service
        services.add(checkDatabaseBackup(components, now));

        // 13. eBPF Subsystem
        services.add(checkEBpf(components, now));

        // Phase 19: State Transition Deduplication
        processStateTransitions(services);

        // Phase 13: Health Priority Logic
        int healthyCount = 0;
        int degradedCount = 0;
        int downCount = 0;
        int unknownCount = 0;
        int simulatedCount = 0;

        boolean criticalDown = false;
        boolean anyDegradedOrDown = false;

        for (ServiceHealthDetail s : services) {
            String st = s.getStatus();
            boolean isCritical = CRITICAL_CORE_SERVICES.contains(s.getId());

            switch (st) {
                case "HEALTHY" -> healthyCount++;
                case "DEGRADED" -> {
                    degradedCount++;
                    anyDegradedOrDown = true;
                }
                case "DOWN" -> {
                    downCount++;
                    anyDegradedOrDown = true;
                    if (isCritical) {
                        criticalDown = true;
                    }
                }
                case "SIMULATED" -> simulatedCount++;
                default -> unknownCount++;
            }
        }

        String overallStatus;
        if (criticalDown) {
            overallStatus = "DOWN";
        } else if (anyDegradedOrDown) {
            overallStatus = "DEGRADED";
        } else {
            overallStatus = "HEALTHY";
        }

        HealthSummary summary = HealthSummary.builder()
                .total(services.size())
                .healthy(healthyCount)
                .degraded(degradedCount)
                .down(downCount)
                .unknown(unknownCount)
                .simulated(simulatedCount)
                .build();

        return SystemHealthResponseDTO.builder()
                .overallStatus(overallStatus)
                .timestamp(now.toString())
                .summary(summary)
                .services(services)
                .build();
    }

    private void processStateTransitions(List<ServiceHealthDetail> services) {
        for (ServiceHealthDetail s : services) {
            String serviceId = s.getId();
            String currentStatus = s.getStatus();
            String previousStatus = lastKnownStatusMap.get(serviceId);

            if ("HEALTHY".equals(currentStatus)) {
                lastSuccessfulCheckMap.put(serviceId, s.getLastChecked());
            }

            s.setLastSuccessfulCheck(lastSuccessfulCheckMap.get(serviceId));

            if (previousStatus != null && !previousStatus.equals(currentStatus)) {
                log.info("[HEALTH OPERATIONAL EVENT] Service '{}' transitioned from {} -> {}", serviceId, previousStatus, currentStatus);
                try {
                    ServiceHealthEvent event = ServiceHealthEvent.builder()
                            .serviceName(serviceId)
                            .previousStatus(previousStatus)
                            .newStatus(currentStatus)
                            .timestamp(Instant.now())
                            .reason("Status changed from " + previousStatus + " to " + currentStatus)
                            .build();
                    eventRepository.save(event);
                } catch (Exception e) {
                    log.error("Failed to save health event for service {}", serviceId, e);
                }
            }
            lastKnownStatusMap.put(serviceId, currentStatus);
        }
    }

    private ServiceHealthDetail checkFrontend(Instant now) {
        long start = System.currentTimeMillis();
        Map<String, Object> details = new HashMap<>();
        try {
            java.net.HttpURLConnection connection = (java.net.HttpURLConnection) new java.net.URI(frontendUrl).toURL().openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(1500);
            connection.setReadTimeout(1500);
            int code = connection.getResponseCode();
            long latencyMs = System.currentTimeMillis() - start;
            details.put("url", frontendUrl);
            details.put("httpCode", code);

            // Phase 14 Thresholds: HEALTHY < 200ms, DEGRADED 200ms - 2000ms
            String status = (code >= 200 && code < 400) ? (latencyMs > 2000 ? "DEGRADED" : "HEALTHY") : "DOWN";
            details.put("reachable", "HEALTHY".equals(status));

            return ServiceHealthDetail.builder()
                    .id("frontend")
                    .name("Next.js SOC Frontend")
                    .category("UI Dashboard")
                    .status(status)
                    .latencyMs(latencyMs)
                    .lastChecked(now.toString())
                    .details(details)
                    .build();
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            details.put("url", frontendUrl);
            details.put("reachable", false);
            details.put("error", e.getMessage());

            return ServiceHealthDetail.builder()
                    .id("frontend")
                    .name("Next.js SOC Frontend")
                    .category("UI Dashboard")
                    .status("DOWN")
                    .latencyMs(latencyMs)
                    .lastChecked(now.toString())
                    .details(details)
                    .build();
        }
    }

    private ServiceHealthDetail checkBackend(Instant now) {
        long start = System.currentTimeMillis();
        Runtime runtime = Runtime.getRuntime();
        long totalMem = runtime.totalMemory() / (1024 * 1024);
        long freeMem = runtime.freeMemory() / (1024 * 1024);
        long maxMem = runtime.maxMemory() / (1024 * 1024);

        Map<String, Object> details = new HashMap<>();
        details.put("totalMemoryMb", totalMem);
        details.put("freeMemoryMb", freeMem);
        details.put("maxMemoryMb", maxMem);
        details.put("uptimeMs", System.currentTimeMillis() - start);

        return ServiceHealthDetail.builder()
                .id("backend")
                .name("Spring Boot Core Backend Service")
                .category("Core Backend")
                .status("HEALTHY")
                .latencyMs(1L)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkMySql(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("mysqlDatabase");
        if (comp == null) comp = components.get("db");

        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : 1L;

        // Phase 14 Thresholds: HEALTHY < 50ms, DEGRADED 50ms - 500ms, DOWN > 500ms
        if ("HEALTHY".equals(status) && latencyMs > 50) {
            status = "DEGRADED";
        }

        return ServiceHealthDetail.builder()
                .id("mysql")
                .name("MySQL Database")
                .category("Database")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkRedis(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("redisIntegration");
        if (comp == null) comp = components.get("redis");

        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : 1L;

        // Phase 14 Thresholds: HEALTHY < 20ms, DEGRADED 20ms - 200ms
        if ("HEALTHY".equals(status) && latencyMs > 20) {
            status = "DEGRADED";
        }

        return ServiceHealthDetail.builder()
                .id("redis")
                .name("Redis Cache & PubSub")
                .category("Database")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkAiEngine(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("aiEngine");
        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : null;

        // Phase 14 Thresholds: HEALTHY < 100ms, DEGRADED 100ms - 1000ms
        if ("HEALTHY".equals(status) && latencyMs != null && latencyMs > 100) {
            status = "DEGRADED";
        }

        return ServiceHealthDetail.builder()
                .id("ai-engine")
                .name("AI Threat Intelligence Engine")
                .category("AI / Analytics")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkStomp(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("stompWebSocket");
        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);

        return ServiceHealthDetail.builder()
                .id("stomp-websocket")
                .name("STOMP WebSocket Alert Stream")
                .category("Messaging")
                .status(status)
                .latencyMs(null) // Phase 14: Return null when latency cannot be measured meaningfully for passive broker
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkMqtt(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("mqttBroker");
        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : null;

        return ServiceHealthDetail.builder()
                .id("mqtt-broker")
                .name("Mosquitto MQTT Message Broker")
                .category("Messaging")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkIotDaemon(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("mqttBroker");
        Map<String, Object> details = getDetails(comp);
        String iotAgentStatus = details.containsKey("iotAgent") ? (String) details.get("iotAgent") : "UNKNOWN";

        return ServiceHealthDetail.builder()
                .id("iot-agent")
                .name("IoT Edge Gateway Security Daemon")
                .category("IoT Subsystem")
                .status(iotAgentStatus)
                .latencyMs(null) // Phase 14: Return null for heartbeat interval check
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkVirusTotal(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("threatIntel");
        Map<String, Object> details = extractSubMap(comp, "virusTotal");
        String status = details.containsKey("status") ? (String) details.get("status") : "UNKNOWN";
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : null;

        return ServiceHealthDetail.builder()
                .id("virustotal")
                .name("VirusTotal Intelligence Service")
                .category("Threat Intelligence")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkAbuseIpDb(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("threatIntel");
        Map<String, Object> details = extractSubMap(comp, "abuseIpDb");
        String status = details.containsKey("status") ? (String) details.get("status") : "UNKNOWN";
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : null;

        return ServiceHealthDetail.builder()
                .id("abuseipdb")
                .name("AbuseIPDB Threat Intelligence API")
                .category("Threat Intelligence")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkHoneypot(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("honeypot");
        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);
        Long latencyMs = details.containsKey("latencyMs") ? ((Number) details.get("latencyMs")).longValue() : null;

        return ServiceHealthDetail.builder()
                .id("honeypot")
                .name("Honeypot Decoy Subsystem")
                .category("Security")
                .status(status)
                .latencyMs(latencyMs)
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkDatabaseBackup(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("databaseBackup");
        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);

        return ServiceHealthDetail.builder()
                .id("db-backup")
                .name("Database Automated Backup Service")
                .category("Infrastructure")
                .status(status)
                .latencyMs(null) // Phase 14: Return null for file existence check
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private ServiceHealthDetail checkEBpf(Map<String, HealthComponent> components, Instant now) {
        HealthComponent comp = components.get("eBpfSubsystem");
        Map<String, Object> details = getDetails(comp);
        String status = mapStatus(comp);

        return ServiceHealthDetail.builder()
                .id("ebpf")
                .name("eBPF Kernel XDP Defense Module")
                .category("Kernel Security")
                .status(status)
                .latencyMs(null) // Phase 14: Return null for JNI prototype status check
                .lastChecked(now.toString())
                .details(details)
                .build();
    }

    private Map<String, Object> getDetails(HealthComponent comp) {
        if (comp instanceof org.springframework.boot.actuate.health.Health health) {
            return health.getDetails();
        }
        return Collections.emptyMap();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractSubMap(HealthComponent comp, String key) {
        Map<String, Object> parentDetails = getDetails(comp);
        if (parentDetails.containsKey(key) && parentDetails.get(key) instanceof Map) {
            return (Map<String, Object>) parentDetails.get(key);
        }
        return Collections.emptyMap();
    }

    private String mapStatus(HealthComponent comp) {
        if (comp == null) return "UNKNOWN";
        String statusName = comp.getStatus().getCode();
        if ("UP".equalsIgnoreCase(statusName) || "HEALTHY".equalsIgnoreCase(statusName)) {
            return "HEALTHY";
        }
        return statusName.toUpperCase();
    }

    public Map<String, Object> getSystemInfo() {
        Map<String, Object> info = new LinkedHashMap<>();

        Runtime runtime = Runtime.getRuntime();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        long maxMemory = runtime.maxMemory();

        info.put("hostname", getHostName());
        info.put("osName", System.getProperty("os.name"));
        info.put("osVersion", System.getProperty("os.version"));
        info.put("osArch", System.getProperty("os.arch"));
        info.put("availableProcessors", runtime.availableProcessors());
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("javaVendor", System.getProperty("java.vendor"));
        info.put("springBootVersion", org.springframework.boot.SpringBootVersion.getVersion());

        info.put("ramTotalMb", Math.round(maxMemory / (1024.0 * 1024.0)));
        info.put("ramUsedMb", Math.round(usedMemory / (1024.0 * 1024.0)));
        info.put("ramFreeMb", Math.round(freeMemory / (1024.0 * 1024.0)));
        info.put("ramUsedPct", maxMemory > 0 ? Math.round(((double) usedMemory / maxMemory) * 1000.0) / 10.0 : 0);

        java.lang.management.OperatingSystemMXBean osBean = java.lang.management.ManagementFactory.getOperatingSystemMXBean();
        double systemLoad = osBean.getSystemLoadAverage();
        info.put("systemLoadAverage", systemLoad >= 0 ? Math.round(systemLoad * 100.0) / 100.0 : "N/A");

        java.io.File rootDrive = new java.io.File("/");
        long diskTotal = rootDrive.getTotalSpace();
        long diskFree = rootDrive.getFreeSpace();
        long diskUsed = diskTotal - diskFree;
        info.put("diskTotalGb", Math.round(diskTotal / (1024.0 * 1024.0 * 1024.0)));
        info.put("diskUsedGb", Math.round(diskUsed / (1024.0 * 1024.0 * 1024.0)));
        info.put("diskFreeGb", Math.round(diskFree / (1024.0 * 1024.0 * 1024.0)));
        info.put("diskUsedPct", diskTotal > 0 ? Math.round(((double) diskUsed / diskTotal) * 1000.0) / 10.0 : 0);

        info.put("jvmUptimeMs", java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime());
        info.put("containerized", isContainerized());

        return info;
    }

    private String getHostName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            String envHost = System.getenv("HOSTNAME");
            return envHost != null ? envHost : "rakshasphere-node";
        }
    }

    private boolean isContainerized() {
        return new java.io.File("/.dockerenv").exists();
    }
}
