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

    @Value("${rakshasphere.ai.url:${RAKSHASPHERE_AI_URL:${AI_ENGINE_URL:https://rakshasphere-v1-1.onrender.com}}}")
    private String aiEngineUrl;

    private final RestTemplate restTemplate;

    public AiEngineHealthIndicator() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(5000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public Health health() {
        long start = System.currentTimeMillis();
        try {
            String cleanUrl = (aiEngineUrl != null ? aiEngineUrl.trim() : "")
                    .replaceAll("/+$", "")
                    .replaceAll("/health$", "")
                    .replaceAll("/predict$", "");
            if (cleanUrl.isBlank()) {
                cleanUrl = "https://rakshasphere-v1-1.onrender.com";
            }

            String healthUrl = cleanUrl + "/health";
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
            String cleanMsg = sanitizeError(e.getMessage());
            log.warn("AI Engine health check failed: {}", cleanMsg);
            return Health.status(CustomHealthStatuses.DOWN)
                    .withDetail("service", "RakshaSphere AI Inference Engine")
                    .withDetail("latencyMs", latencyMs)
                    .withDetail("error", cleanMsg)
                    .build();
        }
    }

    private String sanitizeError(String rawMsg) {
        if (rawMsg == null || rawMsg.isBlank()) {
            return "AI Inference Engine service unreachable";
        }
        if (rawMsg.contains("<html") || rawMsg.contains("<!DOCTYPE") || rawMsg.contains("502 Bad Gateway")) {
            return "AI Inference Engine service unreachable (HTTP 502 Bad Gateway / Connection Refused)";
        }
        if (rawMsg.length() > 200) {
            return rawMsg.substring(0, 200) + "...";
        }
        return rawMsg;
    }
}
