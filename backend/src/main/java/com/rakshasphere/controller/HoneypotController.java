package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.HoneypotEventDTO;
import com.rakshasphere.model.entity.HoneypotEvent;
import com.rakshasphere.model.entity.HoneypotSession;
import com.rakshasphere.service.HoneypotOrchestratorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/honeypots")
public class HoneypotController {

    @Autowired
    private HoneypotOrchestratorService honeypotService;

    // 1. LIST — GET /api/v1/honeypots
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<HoneypotSession>>> getAllHoneypots() {
        List<HoneypotSession> sessions = honeypotService.getAllHoneypots();
        return ResponseEntity.ok(ApiResponseDTO.ok("Active honeypot sessions retrieved", sessions));
    }

    // 2. GET DETAILS — GET /api/v1/honeypots/{id}
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<HoneypotSession>> getHoneypotById(@PathVariable String id) {
        return honeypotService.getHoneypotById(id)
                .map(session -> ResponseEntity.ok(ApiResponseDTO.ok("Honeypot session details retrieved", session)))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // 3. CREATE/DEPLOY — POST /api/v1/honeypots/deploy
    @PostMapping("/deploy")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<HoneypotSession>> deployHoneypot(
            @RequestParam(defaultValue = "SSH") String service,
            @RequestParam(defaultValue = "185.220.101.99") String attackerIp) {
        HoneypotSession newTrap = honeypotService.deployHoneypot(service, attackerIp);
        return ResponseEntity.ok(ApiResponseDTO.ok("Deception trap deployed successfully", newTrap));
    }

    // 4. STOP — POST /api/v1/honeypots/{id}/stop (and /api/v1/honeypots/stop/{id})
    @PostMapping({"/{id}/stop", "/stop/{id}"})
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<HoneypotSession>> stopHoneypot(@PathVariable String id) {
        HoneypotSession stopped = honeypotService.stopHoneypot(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot container stopped", stopped));
    }

    // 5. REMOVE/DELETE — DELETE /api/v1/honeypots/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST')")
    public ResponseEntity<ApiResponseDTO<Void>> deleteHoneypot(@PathVariable String id) {
        honeypotService.deleteHoneypot(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot session removed", null));
    }

    // 6. GET EVENTS — GET /api/v1/honeypots/{id}/events
    @GetMapping("/{id}/events")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<HoneypotEvent>>> getSessionEvents(@PathVariable String id) {
        List<HoneypotEvent> events = honeypotService.getEventsForSession(id);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot events retrieved", events));
    }

    /**
     * Receives events from the Honeypot Manager sidecar.
     * Internal event forwarding endpoint called by the collector.
     */
    @PostMapping("/events")
    public ResponseEntity<ApiResponseDTO<HoneypotEvent>> receiveEvent(@RequestBody HoneypotEventDTO eventDto) {
        HoneypotEvent saved = honeypotService.processEvent(eventDto);
        return ResponseEntity.ok(ApiResponseDTO.ok("Honeypot event processed", saved));
    }
}
