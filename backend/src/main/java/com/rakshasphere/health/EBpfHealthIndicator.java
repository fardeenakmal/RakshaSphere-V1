package com.rakshasphere.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.boot.actuate.health.Status;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.Map;

@Component("eBpfSubsystem")
public class EBpfHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(EBpfHealthIndicator.class);

    @Value("${rakshasphere.ebpf.collector-url:http://localhost:7000}")
    private String collectorUrl;

    private final RestTemplate restTemplate;

    public EBpfHealthIndicator() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(1000);
        factory.setReadTimeout(1000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(collectorUrl + "/api/ebpf/status", Map.class);
            long latencyMs = System.currentTimeMillis() - start;

            if (resp == null) {
                return Health.status("UNAVAILABLE")
                        .withDetail("service", "RakshaSphere eBPF / XDP Kernel Defense Subsystem")
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("reason", "eBPF Collector returned empty response")
                        .build();
            }

            String statusStr = (String) resp.getOrDefault("status", "UNAVAILABLE");
            Status healthStatus = switch (statusStr.toUpperCase()) {
                case "HEALTHY" -> Status.UP;
                case "DEGRADED" -> new Status("DEGRADED");
                default -> new Status("UNAVAILABLE");
            };

            Health.Builder builder = Health.status(healthStatus)
                    .withDetail("service", "RakshaSphere eBPF / XDP Kernel Defense Subsystem")
                    .withDetail("latencyMs", latencyMs);

            resp.forEach((k, v) -> {
                if (v != null) {
                    builder.withDetail(k, v);
                }
            });
            return builder.build();
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            log.debug("eBPF collector query failed: {}", e.getMessage());
            return Health.status("UNAVAILABLE")
                    .withDetail("service", "RakshaSphere eBPF / XDP Kernel Defense Subsystem")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("attached", false)
                    .withDetail("xdpMode", "NOT_ATTACHED")
                    .withDetail("reason", "eBPF telemetry collector unavailable: " + e.getMessage())
                    .build();
        }
    }
}
