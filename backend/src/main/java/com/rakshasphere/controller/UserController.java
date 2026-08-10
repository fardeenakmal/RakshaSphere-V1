package com.rakshasphere.controller;

import com.rakshasphere.dto.ApiResponseDTO;
import com.rakshasphere.model.entity.User;
import com.rakshasphere.model.entity.UserRole;
import com.rakshasphere.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<ApiResponseDTO<List<User>>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(ApiResponseDTO.success("Users retrieved successfully", users));
    }

    @PostMapping
    public ResponseEntity<ApiResponseDTO<User>> createUser(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String name = payload.get("name");
        String email = payload.get("email");
        String rawRole = payload.getOrDefault("role", "ROLE_USER");
        String password = payload.getOrDefault("password", "RakshaUser2026!");

        if (username == null || username.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Username is required"));
        }
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Email is required"));
        }
        if (userRepository.findByUsername(username).isPresent()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Username already exists"));
        }

        UserRole role;
        try {
            role = UserRole.valueOf(rawRole.startsWith("ROLE_") ? rawRole : "ROLE_" + rawRole);
        } catch (IllegalArgumentException e) {
            role = UserRole.ROLE_USER;
        }

        User newUser = User.builder()
                .username(username)
                .name(name != null && !name.isBlank() ? name : username)
                .email(email)
                .password(passwordEncoder.encode(password))
                .role(role)
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
                .mfaEnabled(false)
                .build();

        User savedUser = userRepository.save(newUser);
        return ResponseEntity.ok(ApiResponseDTO.success("User created successfully", savedUser));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<ApiResponseDTO<User>> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        String rawRole = payload.get("role");
        if (rawRole == null || rawRole.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Role is required"));
        }

        UserRole newRole;
        try {
            newRole = UserRole.valueOf(rawRole.startsWith("ROLE_") ? rawRole : "ROLE_" + rawRole);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Invalid role: " + rawRole));
        }

        user.setRole(newRole);
        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponseDTO.success("User role updated successfully", updated));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponseDTO<List<User>>> getPendingUsers() {
        List<User> pendingUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == com.rakshasphere.model.entity.UserStatus.PENDING)
                .toList();
        return ResponseEntity.ok(ApiResponseDTO.success("Pending access requests retrieved", pendingUsers));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponseDTO<User>> approveUser(@PathVariable Long id, @RequestBody(required = false) Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        user.setStatus(com.rakshasphere.model.entity.UserStatus.ACTIVE);

        if (payload != null && payload.containsKey("role") && !payload.get("role").isBlank()) {
            String rawRole = payload.get("role");
            try {
                UserRole newRole = UserRole.valueOf(rawRole.startsWith("ROLE_") ? rawRole : "ROLE_" + rawRole);
                user.setRole(newRole);
            } catch (IllegalArgumentException ignored) {
            }
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponseDTO.success("User account approved and activated successfully", updated));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponseDTO<User>> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        String rawStatus = payload.get("status");
        if (rawStatus == null || rawStatus.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Status is required"));
        }

        try {
            com.rakshasphere.model.entity.UserStatus newStatus = com.rakshasphere.model.entity.UserStatus.valueOf(rawStatus.toUpperCase());
            user.setStatus(newStatus);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("Invalid status: " + rawStatus));
        }

        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponseDTO.success("User account status updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponseDTO<Void>> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.badRequest().body(ApiResponseDTO.error("User not found with id: " + id));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponseDTO.success("User deleted successfully", null));
    }
}
