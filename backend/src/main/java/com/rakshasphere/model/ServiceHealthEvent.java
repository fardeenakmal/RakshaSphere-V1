package com.rakshasphere.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "service_health_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceHealthEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_name", nullable = false)
    private String serviceName;

    @Column(name = "previous_status")
    private String previousStatus;

    @Column(name = "new_status", nullable = false)
    private String newStatus;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    @Column(name = "reason")
    private String reason;
}
