package com.rakshasphere.service;

import com.rakshasphere.dto.*;
import com.rakshasphere.model.entity.User;
import com.rakshasphere.model.entity.UserRole;
import com.rakshasphere.repository.UserRepository;
import com.rakshasphere.security.JwtTokenProvider;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private MfaService mfaService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostConstruct
    public void initDefaultAdmin() {
        // Admin user
        User admin = userRepository.findByUsername("admin").orElseGet(() -> User.builder()
                .username("admin")
                .name("System Administrator")
                .email("admin@rakshasphere.internal")
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
                .build());
        admin.setRole(UserRole.ROLE_ADMIN);
        admin.setPassword(passwordEncoder.encode("Admin@Raksha2026!"));
        admin.setMfaEnabled(false);
        userRepository.save(admin);

        // Analyst user
        User analyst = userRepository.findByUsername("analyst_mike").orElseGet(() -> User.builder()
                .username("analyst_mike")
                .name("Mike Ross")
                .email("mike.r@rakshasphere.internal")
                .avatar("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80")
                .build());
        analyst.setRole(UserRole.ROLE_SOC_ANALYST);
        analyst.setPassword(passwordEncoder.encode("Analyst@Raksha2026!"));
        analyst.setMfaEnabled(false);
        userRepository.save(analyst);

        // Executive viewer user
        User user = userRepository.findByUsername("user").orElseGet(() -> User.builder()
                .username("user")
                .name("Executive Viewer")
                .email("user@rakshasphere.internal")
                .avatar("https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80")
                .build());
        user.setRole(UserRole.ROLE_USER);
        user.setPassword(passwordEncoder.encode("User@Raksha2026!"));
        user.setMfaEnabled(false);
        userRepository.save(user);

        log.info("Default system role accounts initialized (admin, analyst_mike, user)");
    }

    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
        }

        if (user.isMfaEnabled()) {
            if (request.getMfaCode() == null || request.getMfaCode().isBlank()) {
                throw new BadCredentialsException("MFA TOTP code required");
            }
            if (!mfaService.verifyCode(user.getMfaSecret(), request.getMfaCode())) {
                throw new BadCredentialsException("Invalid MFA TOTP code");
            }
        }

        String token = tokenProvider.generateTokenForUsername(user.getUsername());

        return AuthResponseDTO.builder()
                .token(token)
                .type("Bearer")
                .username(user.getUsername())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .avatar(user.getAvatar())
                .build();
    }

    public MfaSetupResponseDTO setupMfa(String username) {
        String secret = mfaService.generateSecretKey();
        String qrUri = mfaService.getQrCodeImageUri(secret, username);

        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setMfaSecret(secret);
            userRepository.save(user);
        }

        return MfaSetupResponseDTO.builder()
                .secret(secret)
                .qrCodeUri(qrUri)
                .build();
    }

    public boolean verifyMfa(String username, String code) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            if (user.getMfaSecret() != null && mfaService.verifyCode(user.getMfaSecret(), code)) {
                user.setMfaEnabled(true);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }
}

