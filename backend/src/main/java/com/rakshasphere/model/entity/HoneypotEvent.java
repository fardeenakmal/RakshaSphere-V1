package com.rakshasphere.model.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "honeypot_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HoneypotEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, length = 50)
    private String sessionId;

    @Column(name = "event_type", nullable = false, length = 100)
    private String eventType;

    @Column(name = "source_ip", length = 45)
    private String sourceIp;

    @Column(name = "source_port")
    private Integer sourcePort;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 100)
    private String username;

    @Column(length = 500)
    private String command;

    @Lob
    @Column(name = "raw_event_json", columnDefinition = "TEXT")
    private String rawEventJson;
}
