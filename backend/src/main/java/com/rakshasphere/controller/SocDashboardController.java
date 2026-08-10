package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.SystemMetricsDTO;
import com.rakshasphere.model.entity.AlertStatus;
import com.rakshasphere.model.entity.AuditLog;
import com.rakshasphere.repository.AuditLogRepository;
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

    @GetMapping("/metrics")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<SystemMetricsDTO>> getSystemMetrics() {
        long activeThreats = alertRepository.countByStatus(AlertStatus.ACTIVE);
        long containedToday = alertRepository.countByStatus(AlertStatus.CONTAINED);

        SystemMetricsDTO metrics = SystemMetricsDTO.builder()
                .activeThreats(activeThreats)
                .containedToday(containedToday)
                .ebpfDropsCount(1420L)
                .activeHoneypots(4L)
                .systemRiskScore(78)
                .networkHealthPct(98.4)
                .ingestedFlowsPerSec(14500L)
                .selfHealingLatencyMs(112)
                .build();

        return ResponseEntity.ok(ApiResponseDTO.ok("SOC system metrics retrieved", metrics));
    }

    @GetMapping("/audit-logs")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<AuditLog>>> getAuditLogs() {
        List<AuditLog> auditLogs = auditLogRepository.findTop20ByOrderByTimestampDesc();
        return ResponseEntity.ok(ApiResponseDTO.ok("Audit logs retrieved", auditLogs));
    }
}
