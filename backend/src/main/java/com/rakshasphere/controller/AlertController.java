package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.FlowIngestionDTO;
import com.rakshasphere.model.entity.AlertSeverity;
import com.rakshasphere.model.entity.AlertStatus;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.service.AiEngineService;
import com.rakshasphere.service.SecurityAlertService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    @Autowired
    private SecurityAlertService alertService;

    @Autowired
    private AiEngineService aiEngineService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<SecurityAlert>>> getAllAlerts() {
        List<SecurityAlert> alerts = alertService.getAllAlerts();
        return ResponseEntity.ok(ApiResponseDTO.ok("Security alerts retrieved successfully", alerts));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<SecurityAlert>> getAlertById(@PathVariable String id) {
        return alertService.getAlertById(id)
                .map(alert -> ResponseEntity.ok(ApiResponseDTO.ok("Alert details retrieved", alert)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<SecurityAlert>> createAlert(@RequestBody SecurityAlert alert) {
        if (alert.getId() == null || alert.getId().isEmpty()) {
            alert.setId("ALT-" + System.currentTimeMillis());
        }
        if (alert.getTimestamp() == null) {
            alert.setTimestamp(LocalDateTime.now());
        }
        if (alert.getStatus() == null) {
            alert.setStatus(AlertStatus.ACTIVE);
        }
        if (alert.getConfidence() == null) {
            alert.setConfidence(0.95);
        }
        SecurityAlert saved = alertService.saveAndBroadcastAlert(alert);
        return ResponseEntity.ok(ApiResponseDTO.ok("Alert ingested successfully", saved));
    }

    @PostMapping("/ingest-flow")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<SecurityAlert>> ingestNetworkFlow(@Valid @RequestBody FlowIngestionDTO flowDto) {
        // Step 1: Query Python AI Engine for threat classification & dynamic risk score
        Map aiRes = aiEngineService.predict(flowDto.getFlowFeatures(), 5);
        Map aiData = (Map) aiRes.get("data");

        if (aiData == null) {
            return ResponseEntity.internalServerError().body(ApiResponseDTO.error("AI Engine inference returned empty data payload"));
        }

        // Step 2: Map AI prediction output to SecurityAlert domain model
        String attackType = (String) aiData.get("attackType");
        String severityStr = (String) aiData.get("severity");
        AlertSeverity severity = AlertSeverity.HIGH;
        if (severityStr != null) {
            try {
                severity = AlertSeverity.valueOf(severityStr.toUpperCase());
            } catch (Exception ignored) {}
        }

        int riskScore = aiData.get("riskScore") != null ? ((Number) aiData.get("riskScore")).intValue() : 50;
        double confidence = aiData.get("confidenceScore") != null ? ((Number) aiData.get("confidenceScore")).doubleValue() : 0.9;
        String mitreTactic = (String) aiData.get("mitreTactic");
        String mitreTechnique = (String) aiData.get("mitreTechnique");
        String mitreId = (String) aiData.get("mitreId");
        Double mseLoss = aiData.get("reconstructionMse") != null ? ((Number) aiData.get("reconstructionMse")).doubleValue() : 0.0;

        if (mitreId == null || mitreId.isBlank()) {
            String resolvedAttack = attackType != null ? attackType.toUpperCase() : "";
            if (resolvedAttack.contains("BENIGN")) {
                mitreId = null;
                mitreTactic = null;
                mitreTechnique = null;
            } else if (resolvedAttack.contains("BRUTE") || resolvedAttack.contains("SSH")) {
                mitreId = "T1110";
                mitreTactic = "Initial Access";
                mitreTechnique = "Brute Force";
            } else if (resolvedAttack.contains("SQL") || resolvedAttack.contains("HTTP") || resolvedAttack.contains("WEB")) {
                mitreId = "T1190";
                mitreTactic = "Execution";
                mitreTechnique = "Exploit Public-Facing Application";
            } else if (resolvedAttack.contains("TELNET") || resolvedAttack.contains("MIRAI") || resolvedAttack.contains("SCAN")) {
                mitreId = "T1046";
                mitreTactic = "Discovery";
                mitreTechnique = "Network Service Discovery";
            } else if (resolvedAttack.contains("DDOS") || resolvedAttack.contains("FLOOD")) {
                mitreId = "T1498";
                mitreTactic = "Impact";
                mitreTechnique = "Network Denial of Service";
            } else {
                mitreId = "T1059";
                mitreTactic = "Execution";
                mitreTechnique = "Command and Scripting Interpreter";
            }
        }


        SecurityAlert alert = SecurityAlert.builder()
                .id("ALT-" + System.currentTimeMillis())
                .timestamp(LocalDateTime.now())
                .sourceIp(flowDto.getSourceIp() != null ? flowDto.getSourceIp() : "192.168.1.105")
                .destinationIp(flowDto.getDestinationIp() != null ? flowDto.getDestinationIp() : "10.0.0.1")
                .sourcePort(flowDto.getSourcePort() != null ? flowDto.getSourcePort() : 44332)
                .destinationPort(flowDto.getDestinationPort() != null ? flowDto.getDestinationPort() : 22)
                .attackType(attackType != null ? attackType : "SUSPICIOUS_NETWORK_FLOW")
                .severity(severity)
                .riskScore(riskScore)
                .confidence(confidence)
                .mitreTactic(mitreTactic)
                .mitreTechnique(mitreTechnique)
                .mitreId(mitreId)
                .status(AlertStatus.ACTIVE)

                .remediationAction(riskScore >= 70 ? "Auto-remediation queued via eBPF XDP filter" : "Monitored")
                .flowDurationMs(flowDto.getFlowFeatures().get(0).longValue())
                .totalFwdPackets(flowDto.getFlowFeatures().get(1).intValue())
                .packetLengthMean(flowDto.getFlowFeatures().get(2))
                .autoencoderAnomalyScore(mseLoss)
                .build();

        // Step 3: Enrich Threat Intel (VirusTotal/AbuseIPDB), persist in MySQL DB, and publish to STOMP WebSocket (/topic/alerts)
        SecurityAlert savedAlert = alertService.saveAndBroadcastAlert(alert);

        return ResponseEntity.ok(ApiResponseDTO.ok("Network flow analyzed and alert published", savedAlert));
    }
}
