package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.MitreStatsDTO;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.service.MitreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/mitre")
public class MitreController {

    @Autowired
    private MitreService mitreService;

    @GetMapping("/matrix")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<List<MitreStatsDTO>>> getMatrixStats() {
        List<MitreStatsDTO> stats = mitreService.getMatrixStats();
        return ResponseEntity.ok(ApiResponseDTO.ok("MITRE ATT&CK matrix statistics retrieved", stats));
    }

    @GetMapping("/techniques/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<Map<String, Object>>> getTechniqueDetail(@PathVariable String id) {
        MitreStatsDTO stats = mitreService.getStatsForTechnique(id);
        List<SecurityAlert> alerts = mitreService.getAlertsForTechnique(id);

        Map<String, Object> response = new HashMap<>();
        response.put("stats", stats);
        response.put("alerts", alerts);

        return ResponseEntity.ok(ApiResponseDTO.ok("MITRE technique detail retrieved", response));
    }
}
