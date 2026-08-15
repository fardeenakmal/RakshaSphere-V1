package com.rakshasphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemHealthResponseDTO {
    private String overallStatus;
    private String timestamp;
    private HealthSummary summary;
    private List<ServiceHealthDetail> services;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HealthSummary {
        private int total;
        private int healthy;
        private int degraded;
        private int down;
        private int unknown;
        private int simulated;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceHealthDetail {
        private String id;
        private String name;
        private String category;
        private String status;
        private Long latencyMs;
        private String lastChecked;
        private String lastSuccessfulCheck;
        private Map<String, Object> details;
    }
}
