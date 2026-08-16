package com.rakshasphere.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "security_alerts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SecurityAlert {

    @Id
    @Column(length = 50)
    private String id;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "source_ip", nullable = false, length = 45)
    private String sourceIp;

    @Column(name = "destination_ip", nullable = false, length = 45)
    private String destinationIp;

    @Column(name = "source_port", nullable = false)
    private Integer sourcePort;

    @Column(name = "destination_port", nullable = false)
    private Integer destinationPort;

    @Column(name = "attack_type", nullable = false, length = 100)
    private String attackType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AlertSeverity severity;

    @Column(name = "risk_score", nullable = false)
    private Integer riskScore;

    @Column(name = "confidence_score", nullable = false)
    @com.fasterxml.jackson.annotation.JsonProperty("confidenceScore")
    private Double confidence;

    @Column(name = "mitre_tactic", nullable = true, length = 100)
    private String mitreTactic;

    @Column(name = "mitre_technique", nullable = true, length = 100)
    private String mitreTechnique;

    @Column(name = "mitre_id", nullable = true, length = 30)
    private String mitreId;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private AlertStatus status;

    @Column(name = "remediation_action", length = 255)
    private String remediationAction;

    @Column(name = "flow_duration_ms")
    private Long flowDurationMs;

    @Column(name = "total_fwd_packets")
    private Integer totalFwdPackets;

    @Column(name = "packet_length_mean")
    private Double packetLengthMean;

    @Column(name = "anomaly_score")
    private Double autoencoderAnomalyScore;

    @Column(name = "virustotal_score", length = 50)
    private String virusTotalScore;

    @Column(name = "abuseipdb_confidence")
    private Integer abuseIpDbConfidence;

    @Column(name = "geo_country", length = 50)
    private String country;

    @Column(name = "isp_name", length = 100)
    private String isp;
}
