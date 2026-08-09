package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.RemediationRequestDTO;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.service.SelfHealingService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/self-healing")
public class SelfHealingController {

    @Autowired
    private SelfHealingService selfHealingService;

    @PostMapping("/remediate")
    public ResponseEntity<ApiResponseDTO<SecurityAlert>> remediateAlert(@Valid @RequestBody RemediationRequestDTO request) {
        String actionType = request.getActionType() != null ? request.getActionType() : "eBPF_DROP";

        SecurityAlert updatedAlert = switch (actionType.toUpperCase()) {
            case "HONEYPOT", "DIVERT_HONEYPOT" -> selfHealingService.divertToHoneypot(request.getAlertId(), "SOC Operator (REST)");
            case "REVERT", "REVERT_BLOCK" -> selfHealingService.revertEbpfRule(request.getAlertId(), "SOC Operator (REST)");
            default -> selfHealingService.applyEbpfDrop(request.getAlertId(), "Autonomous Engine (REST)");
        };

        return ResponseEntity.ok(ApiResponseDTO.ok("Autonomous self-healing action executed successfully", updatedAlert));
    }
}
