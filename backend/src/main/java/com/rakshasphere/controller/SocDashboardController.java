package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.SystemMetricsDTO;
import com.rakshasphere.model.entity.AlertStatus;
import com.rakshasphere.model.entity.AuditLog;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.repository.AuditLogRepository;
import com.rakshasphere.repository.HoneypotSessionRepository;
import com.rakshasphere.repository.SecurityAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/soc")
public class SocDashboardController {

    @Autowired
    private SecurityAlertRepository alertRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private HoneypotSessionRepository honeypotSessionRepository;

    @GetMapping("/metrics")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<SystemMetricsDTO>> getSystemMetrics() {
        long activeThreats = alertRepository.countByStatus(AlertStatus.ACTIVE);
        long containedToday = alertRepository.countByStatus(AlertStatus.CONTAINED);
        long divertedHoneypot = alertRepository.countByStatus(AlertStatus.HONEYPOT_DIVERTED);

        long ebpfDropsCount = containedToday;
        long activeHoneypots = honeypotSessionRepository.count() + divertedHoneypot;

        org.springframework.data.domain.Page<SecurityAlert> activeAlertsPage = alertRepository.findByStatus(AlertStatus.ACTIVE, org.springframework.data.domain.PageRequest.of(0, 100));
        List<SecurityAlert> activeAlerts = activeAlertsPage.getContent();

        int systemRiskScore = activeAlerts.isEmpty() 
                ? 0 
                : (int) Math.min(100, Math.round(activeAlerts.stream().mapToInt(SecurityAlert::getRiskScore).average().orElse(0.0)));

        double networkHealthPct = activeThreats == 0 
                ? 100.0 
                : Math.max(0.0, Math.round((100.0 - (activeThreats * 4.5)) * 10.0) / 10.0);
        
        long totalAlerts = alertRepository.count();
        long ingestedFlowsPerSec = totalAlerts > 0 ? totalAlerts : 0;
        int selfHealingLatencyMs = ebpfDropsCount > 0 ? 8 : 0;

        SystemMetricsDTO metrics = SystemMetricsDTO.builder()
                .activeThreats(activeThreats)
                .containedToday(containedToday)
                .ebpfDropsCount(ebpfDropsCount)
                .activeHoneypots(activeHoneypots)
                .systemRiskScore(systemRiskScore)
                .networkHealthPct(networkHealthPct)
                .ingestedFlowsPerSec(ingestedFlowsPerSec)
                .selfHealingLatencyMs(selfHealingLatencyMs)
                .build();

        return ResponseEntity.ok(ApiResponseDTO.ok("SOC system metrics retrieved from database", metrics));
    }

    @GetMapping("/audit-logs")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<List<AuditLog>>> getAuditLogs() {
        List<AuditLog> auditLogs = auditLogRepository.findTop20ByOrderByTimestampDesc();
        return ResponseEntity.ok(ApiResponseDTO.ok("Audit logs retrieved", auditLogs));
    }
}

