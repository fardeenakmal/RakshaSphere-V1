package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.model.entity.HoneypotSession;
import com.rakshasphere.service.HoneypotOrchestratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/honeypots")
public class HoneypotController {

    @Autowired
    private HoneypotOrchestratorService honeypotService;

    @GetMapping
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<HoneypotSession>>> getAllHoneypots() {
        List<HoneypotSession> sessions = honeypotService.getAllHoneypots();
        return ResponseEntity.ok(ApiResponseDTO.ok("Active honeypot sessions retrieved", sessions));
    }

    @PostMapping("/deploy")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<HoneypotSession>> deployHoneypot(
            @RequestParam(defaultValue = "SSH") String service,
            @RequestParam(defaultValue = "185.220.101.99") String attackerIp) {
        HoneypotSession newTrap = honeypotService.deployHoneypot(service, attackerIp);
        return ResponseEntity.ok(ApiResponseDTO.ok("Deception trap deployed successfully", newTrap));
    }
}
