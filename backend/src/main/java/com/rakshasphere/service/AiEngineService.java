package com.rakshasphere.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiEngineService {

    private static final Logger log = LoggerFactory.getLogger(AiEngineService.class);

    private final WebClient webClient;

    public AiEngineService(WebClient.Builder webClientBuilder,
                           @Value("${rakshasphere.ai.url:http://ai-engine:5000}") String aiEngineUrl) {
        this.webClient = webClientBuilder.baseUrl(aiEngineUrl).build();
        log.info("Initialized AiEngineService target URL: {}", aiEngineUrl);
    }

    public Map getHealth() {
        try {
            return webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            log.warn("AI Engine health check failed: {}", e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("status", "DOWN");
            fallback.put("error", e.getMessage());
            return fallback;
        }
    }

    public Map predict(List<Double> flowFeatures, Integer topK) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("flowFeatures", flowFeatures);
        if (topK != null) {
            payload.put("topK", topK);
        }

        return webClient.post()
                .uri("/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map explain(List<Double> flowFeatures, Integer topK) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("flowFeatures", flowFeatures);
        payload.put("topK", topK != null ? topK : 5);

        return webClient.post()
                .uri("/explain")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    public Map batchPredict(List<List<Double>> flows) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("flows", flows);

        return webClient.post()
                .uri("/batch-predict")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
