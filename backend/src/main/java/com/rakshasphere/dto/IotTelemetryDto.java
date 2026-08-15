package com.rakshasphere.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class IotTelemetryDto {
    private String deviceId;
    private String timestamp;
    private Double cpuUsagePct;
    private Double memoryUsagePct;
    private NetworkStats networkStats;
    private ConnectionQuality connectionQuality;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class NetworkStats {
        private Integer activeSockets;
        private Integer rxPacketsPerSec;
        private Integer txPacketsPerSec;
        private Integer droppedPackets;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ConnectionQuality {
        private Double latencyMs;
        private Integer signalStrengthDbm;
    }
}
