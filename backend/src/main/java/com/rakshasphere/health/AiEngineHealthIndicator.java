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

@Component("aiEngine")
public class AiEngineHealthIndicator implements HealthIndicator {

    private static final Logger log = LoggerFactory.getLogger(AiEngineHealthIndicator.class);

    @Value("${RAKSHASPHERE_AI_URL:http://localhost:5000}")
    private String aiEngineUrl;

    private final RestTemplate restTemplate;

    public AiEngineHealthIndicator() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(2000);
        factory.setReadTimeout(2000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try {
            String healthUrl = aiEngineUrl + "/health";
            Map<String, Object> response = restTemplate.getForObject(healthUrl, Map.class);
            long latencyMs = System.currentTimeMillis() - start;

            if (response != null && "UP".equalsIgnoreCase(String.valueOf(response.get("status")))) {
                Boolean modelReady = (Boolean) response.get("modelReady");
                if (Boolean.TRUE.equals(modelReady)) {
                    return Health.status(CustomHealthStatuses.HEALTHY)
                            .withDetail("service", "RakshaSphere AI Inference Engine")
                            .withDetail("modelReady", true)
                            .withDetail("latencyMs", latencyMs)
                            .withDetail("manifest", response.get("manifest"))
                            .build();
                } else {
                    return Health.status(CustomHealthStatuses.DEGRADED)
                            .withDetail("service", "RakshaSphere AI Inference Engine")
                            .withDetail("modelReady", false)
                            .withDetail("latencyMs", latencyMs)
                            .withDetail("issue", "AI model is not ready")
                            .build();
                }
            } else {
                return Health.status(CustomHealthStatuses.DEGRADED)
                        .withDetail("service", "RakshaSphere AI Inference Engine")
                        .withDetail("latencyMs", latencyMs)
                        .withDetail("issue", "Unexpected response status from AI Engine")
                        .build();
            }
        } catch (Exception e) {
            long latencyMs = System.currentTimeMillis() - start;
            log.warn("AI Engine health check failed: {}", e.getMessage());
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("service", "RakshaSphere AI Inference Engine")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
