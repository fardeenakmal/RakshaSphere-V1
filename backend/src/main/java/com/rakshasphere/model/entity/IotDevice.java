package com.rakshasphere.model.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "iot_devices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IotDevice {

    @Id
    @Column(name = "device_id", length = 50)
    private String deviceId;

    @Column(name = "status", length = 20, nullable = false)
    private String status;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "mac_address", length = 17)
    private String macAddress;

    @Column(name = "cpu_usage_pct")
    private Double cpuUsagePct;

    @Column(name = "memory_usage_pct")
    private Double memoryUsagePct;

    @Column(name = "active_sockets")
    private Integer activeSockets;

    @Column(name = "latency_ms")
    private Double latencyMs;

    @Column(name = "last_heartbeat")
    private LocalDateTime lastHeartbeat;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (lastHeartbeat == null) {
            lastHeartbeat = LocalDateTime.now();
        }
        if (status == null) {
            status = "ONLINE";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        lastHeartbeat = LocalDateTime.now();
    }
}
