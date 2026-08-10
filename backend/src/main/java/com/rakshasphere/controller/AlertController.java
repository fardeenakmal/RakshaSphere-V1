package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.service.SecurityAlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    @Autowired
    private SecurityAlertService alertService;

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<SecurityAlert>>> getAllAlerts() {
        List<SecurityAlert> alerts = alertService.getAllAlerts();
        return ResponseEntity.ok(ApiResponseDTO.ok("Security alerts retrieved successfully", alerts));
    }

    @GetMapping("/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<SecurityAlert>> getAlertById(@PathVariable String id) {
        return alertService.getAlertById(id)
                .map(alert -> ResponseEntity.ok(ApiResponseDTO.ok("Alert details retrieved", alert)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<SecurityAlert>> createAlert(@RequestBody SecurityAlert alert) {
        if (alert.getId() == null || alert.getId().isEmpty()) {
            alert.setId("ALT-" + System.currentTimeMillis());
        }
        if (alert.getTimestamp() == null) {
            alert.setTimestamp(java.time.LocalDateTime.now());
        }
        if (alert.getStatus() == null) {
            alert.setStatus(com.rakshasphere.model.entity.AlertStatus.ACTIVE);
        }
        if (alert.getConfidence() == null) {
            alert.setConfidence(0.95);
        }
        SecurityAlert saved = alertService.saveAndBroadcastAlert(alert);
        return ResponseEntity.ok(ApiResponseDTO.ok("Alert ingested successfully", saved));
    }
}
