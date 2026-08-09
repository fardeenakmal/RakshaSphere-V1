package com.rakshasphere.service;

import com.rakshasphere.dto.*;
import com.rakshasphere.model.entity.User;
import com.rakshasphere.model.entity.UserRole;
import com.rakshasphere.repository.UserRepository;
import com.rakshasphere.security.JwtTokenProvider;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthenticationService {

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
        User admin = userRepository.findByUsername("admin").orElseGet(() -> User.builder()
                .username("admin")
                .name("System Administrator")
                .email("admin@rakshasphere.internal")
                .role(UserRole.ROLE_ADMIN)
                .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80")
                .build());

        admin.setPassword(passwordEncoder.encode("Admin@Raksha2026!"));
        admin.setMfaEnabled(false);
        userRepository.save(admin);
        System.out.println("Initialized default production administrator account: admin / Admin@Raksha2026!");
    }

    public AuthResponseDTO authenticate(AuthRequestDTO request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BadCredentialsException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Invalid username or password");
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
