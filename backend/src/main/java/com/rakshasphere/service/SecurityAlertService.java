package com.rakshasphere.service;

import com.rakshasphere.model.entity.AlertSeverity;
import com.rakshasphere.model.entity.AlertStatus;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.repository.SecurityAlertRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class SecurityAlertService {

    @Autowired
    private SecurityAlertRepository alertRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ThreatIntelService threatIntelService;

    @PostConstruct
    public void seedInitialData() {
        // Production Mode: No hardcoded test alert seeding.
        // Dynamic alerts are populated strictly via live eBPF telemetry & STOMP ingress.
    }

    public List<SecurityAlert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public Optional<SecurityAlert> getAlertById(String id) {
        return alertRepository.findById(id);
    }

    @Transactional
    public SecurityAlert saveAndBroadcastAlert(SecurityAlert alert) {
        if (alert.getVirusTotalScore() == null && alert.getSourceIp() != null) {
            try {
                var intel = threatIntelService.enrichIpData(alert.getSourceIp()).block();
                if (intel != null) {
                    alert.setVirusTotalScore(intel.get("virusTotalScore"));
                    alert.setAbuseIpDbConfidence(Integer.parseInt(intel.get("abuseIpDbConfidence")));
                    alert.setCountry(intel.get("geoCountry"));
                    alert.setIsp(intel.get("ispName"));
                }
            } catch (Exception e) {
                System.err.println("Failed to enrich threat intel: " + e.getMessage());
            }
        }

        SecurityAlert saved = alertRepository.save(alert);
        try {
            messagingTemplate.convertAndSend("/topic/alerts", saved);
        } catch (Exception ignored) {}
        return saved;
    }
}
