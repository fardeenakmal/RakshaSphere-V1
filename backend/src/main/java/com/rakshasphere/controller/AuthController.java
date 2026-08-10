package com.rakshasphere.controller;

import com.rakshasphere.dto.*;
import com.rakshasphere.service.AuthenticationService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @Autowired
    private AuthenticationService authenticationService;

    @PostMapping("/login")
    public ResponseEntity<ApiResponseDTO<AuthResponseDTO>> login(@Valid @RequestBody AuthRequestDTO request) {
        AuthResponseDTO response = authenticationService.authenticate(request);
        return ResponseEntity.ok(ApiResponseDTO.ok("Authentication successful", response));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponseDTO<com.rakshasphere.model.entity.User>> register(@Valid @RequestBody RegisterRequestDTO request) {
        com.rakshasphere.model.entity.User registeredUser = authenticationService.register(request);
        return ResponseEntity.ok(ApiResponseDTO.ok("Access request submitted successfully. Account pending administrator approval.", registeredUser));
    }

    @GetMapping("/mfa/setup")
    public ResponseEntity<ApiResponseDTO<MfaSetupResponseDTO>> setupMfa(@RequestParam String username) {
        MfaSetupResponseDTO response = authenticationService.setupMfa(username);
        return ResponseEntity.ok(ApiResponseDTO.ok("MFA secret & QR code generated successfully", response));
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<ApiResponseDTO<String>> verifyMfa(@Valid @RequestBody MfaVerifyRequestDTO request) {
        boolean isValid = authenticationService.verifyMfa(request.getUsername(), request.getCode());
        if (isValid) {
            return ResponseEntity.ok(ApiResponseDTO.ok("MFA verification successful. Two-Factor Authentication is enabled.", "VERIFIED"));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponseDTO.error("Invalid TOTP code or user not found"));
        }
    }
}
