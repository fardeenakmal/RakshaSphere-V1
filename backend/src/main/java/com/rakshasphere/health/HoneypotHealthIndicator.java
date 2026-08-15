package com.rakshasphere.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Component("honeypot")
public class HoneypotHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(HoneypotHealthIndicator.class);

    @Value("${rakshasphere.honeypot.manager-url:http://localhost:6000}")
    private String managerUrl;

    private final RestTemplate restTemplate;

    public HoneypotHealthIndicator() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(2000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try {
            String healthUrl = managerUrl + "/health";
            Map<String, Object> response = restTemplate.getForObject(healthUrl, Map.class);
            long latencyMs = System.currentTimeMillis() - start;

            if (response != null) {
                Boolean dockerOk = (Boolean) response.get("dockerConnected");
                int activeHoneypots = response.get("activeHoneypots") != null ? ((Number) response.get("activeHoneypots")).intValue() : 0;
                int maxHoneypots = response.get("maxHoneypots") != null ? ((Number) response.get("maxHoneypots")).intValue() : 5;

                if (Boolean.TRUE.equals(dockerOk)) {
                    return Health.status(CustomHealthStatuses.HEALTHY)
                            .withDetail("service", "RakshaSphere Honeypot Subsystem")
                            .withDetail("managerReachable", true)
                            .withDetail("dockerConnected", true)
                            .withDetail("activeHoneypots", activeHoneypots)
                            .withDetail("maxHoneypots", maxHoneypots)
                            .withDetail("latencyMs", latencyMs)
                            .build();
                } else {
                    return Health.status(CustomHealthStatuses.DEGRADED)
                            .withDetail("service", "RakshaSphere Honeypot Subsystem")
                            .withDetail("managerReachable", true)
                            .withDetail("dockerConnected", false)
                            .withDetail("latencyMs", latencyMs)
                            .withDetail("issue", "Honeypot manager cannot connect to Docker daemon")
                            .build();
                }
            } else {
                return Health.status(CustomHealthStatuses.DEGRADED)
                        .withDetail("service", "RakshaSphere Honeypot Subsystem")
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("issue", "Empty response from Honeypot Manager")
                        .build();
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            log.warn("Honeypot Manager health check failed: {}", e.getMessage());
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("service", "RakshaSphere Honeypot Subsystem")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
