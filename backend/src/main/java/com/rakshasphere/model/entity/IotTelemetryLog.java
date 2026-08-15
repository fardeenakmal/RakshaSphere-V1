package com.rakshasphere.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "iot_telemetry_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IotTelemetryLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", length = 50, nullable = false)
    private String deviceId;

    @Column(name = "cpu_usage_pct")
    private Double cpuUsagePct;

    @Column(name = "memory_usage_pct")
    private Double memoryUsagePct;

    @Column(name = "active_sockets")
    private Integer activeSockets;

    @Column(name = "latency_ms")
    private Double latencyMs;

    @Column(name = "raw_payload", columnDefinition = "TEXT")
    private String rawPayload;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
    }
}
