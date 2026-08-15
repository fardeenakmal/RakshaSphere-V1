package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.dto.SystemHealthResponseDTO;
import com.rakshasphere.service.SystemHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/system")
public class SystemHealthController {

    private final SystemHealthService systemHealthService;

    @Autowired
    public SystemHealthController(SystemHealthService systemHealthService) {
        this.systemHealthService = systemHealthService;
    }

    @GetMapping("/health")
    public ResponseEntity<ApiResponseDTO<SystemHealthResponseDTO>> getSystemHealth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        boolean isAdmin = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        SystemHealthResponseDTO healthResponse = systemHealthService.getSystemHealth();

        if (!isAdmin) {
            // Strip operational details
            if (healthResponse.getServices() != null) {
                for (SystemHealthResponseDTO.ServiceHealthDetail service : healthResponse.getServices()) {
                    service.setDetails(null);
                }
            }
        }

        return ResponseEntity.ok(ApiResponseDTO.ok("System health status aggregated successfully", healthResponse));
    }

    @GetMapping("/info")
    public ResponseEntity<ApiResponseDTO<java.util.Map<String, Object>>> getSystemInfo() {
        java.util.Map<String, Object> info = systemHealthService.getSystemInfo();
        return ResponseEntity.ok(ApiResponseDTO.ok("System hardware and runtime information retrieved", info));
    }
}
