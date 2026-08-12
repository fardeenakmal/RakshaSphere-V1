package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.HoneypotEventDTO;
import com.rakshasphere.model.entity.HoneypotEvent;
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

    @PostMapping("/stop/{sessionId}")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<HoneypotSession>> stopHoneypot(
            @PathVariable String sessionId) {
        HoneypotSession stopped = honeypotService.stopHoneypot(sessionId);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot container stopped", stopped));
    }

    /**
     * Receives events from the Honeypot Manager sidecar.
     * This endpoint is called by the internal event collector, not by the UI.
     */
    @PostMapping("/events")
    public ResponseEntity<ApiResponseDTO<HoneypotEvent>> receiveEvent(
            @RequestBody HoneypotEventDTO eventDto) {
        HoneypotEvent saved = honeypotService.processEvent(eventDto);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot event processed", saved));
    }

    @GetMapping("/{sessionId}/events")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<HoneypotEvent>>> getSessionEvents(
            @PathVariable String sessionId) {
        List<HoneypotEvent> events = honeypotService.getEventsForSession(sessionId);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot events retrieved", events));
    }
}
