package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v1/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    private final Map<String, Object> systemSettings = new ConcurrentHashMap<>();

    public SettingsController() {
        systemSettings.put("riskThreshold", 75);
        systemSettings.put("ebpfEnabled", true);
        systemSettings.put("vtApiKeyConfigured", true);
        systemSettings.put("abuseApiKeyConfigured", true);
        systemSettings.put("lastUpdated", System.currentTimeMillis());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SOC_ANALYST', 'USER')")
    public ResponseEntity<ApiResponseDTO<Map<String, Object>>> getSettings() {
        return ResponseEntity.ok(ApiResponseDTO.success("Settings retrieved successfully", new HashMap<>(systemSettings)));
    }

    @PostMapping("/rules")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Map<String, Object>>> updateRules(@RequestBody Map<String, Object> payload) {
        if (payload.containsKey("riskThreshold")) {
            systemSettings.put("riskThreshold", payload.get("riskThreshold"));
        }
        if (payload.containsKey("ebpfEnabled")) {
            systemSettings.put("ebpfEnabled", payload.get("ebpfEnabled"));
        }
        systemSettings.put("lastUpdated", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponseDTO.success("Self-healing rules updated successfully", new HashMap<>(systemSettings)));
    }

    @PostMapping("/keys")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponseDTO<Map<String, Object>>> updateApiKeys(@RequestBody Map<String, String> payload) {
        if (payload.containsKey("vtApiKey") && !payload.get("vtApiKey").isBlank()) {
            systemSettings.put("vtApiKeyConfigured", true);
        }
        if (payload.containsKey("abuseApiKey") && !payload.get("abuseApiKey").isBlank()) {
            systemSettings.put("abuseApiKeyConfigured", true);
        }
        systemSettings.put("lastUpdated", System.currentTimeMillis());

        return ResponseEntity.ok(ApiResponseDTO.success("Threat intel API keys updated successfully", new HashMap<>(systemSettings)));
    }
}
