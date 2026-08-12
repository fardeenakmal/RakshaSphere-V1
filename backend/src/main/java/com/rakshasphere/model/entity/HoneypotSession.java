package com.rakshasphere.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "honeypot_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoneypotSession {

    @Id
    @Column(length = 50)
    private String id;

    @Column(nullable = false, length = 20)
    private String service;

    @Column(name = "container_id", nullable = false, length = 100)
    private String containerId;

    @Column(name = "attacker_ip", nullable = false, length = 45)
    private String attackerIp;

    @Column(nullable = false)
    private Integer port;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;


    @Column(nullable = false, length = 20)
    private String status;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String keystrokesJson;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String commandsJson;

    @Column(name = "payloads_captured")
    private Integer capturedPayloadsCount;

    @Column(name = "risk_score")
    private Integer riskScore;
}
