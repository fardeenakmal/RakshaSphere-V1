package com.rakshasphere.aspect;

import com.rakshasphere.model.entity.AuditLog;
import com.rakshasphere.repository.AuditLogRepository;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Aspect
@Component
public class AuditLogAspect {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Pointcut("within(com.rakshasphere.controller..*)")
    public void controllerMethods() {}

    @AfterReturning(pointcut = "controllerMethods()", returning = "result")
    public void logSuccessfulAction(JoinPoint joinPoint, Object result) {
        saveAuditLog(joinPoint, "SUCCESS");
    }

    @AfterThrowing(pointcut = "controllerMethods()", throwing = "ex")
    public void logFailedAction(JoinPoint joinPoint, Throwable ex) {
        saveAuditLog(joinPoint, "FAILED: " + ex.getMessage());
    }

    private void saveAuditLog(JoinPoint joinPoint, String status) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            String actor = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                    ? auth.getName()
                    : "SYSTEM/ANONYMOUS";

            String action = joinPoint.getSignature().getName();
            String target = joinPoint.getSignature().getDeclaringTypeName();
            LocalDateTime timestamp = LocalDateTime.now();
            String id = "LOG-" + UUID.randomUUID().toString().substring(0, 8);

            String previousHash = auditLogRepository.findTop20ByOrderByTimestampDesc()
                    .stream()
                    .findFirst()
                    .map(AuditLog::getHash)
                    .orElse("0000000000000000000000000000000000000000000000000000000000000000");

            String dataToHash = id + "|" + timestamp + "|" + actor + "|" + action + "|" + target + "|" + status + "|" + previousHash;
            String cryptoHash = computeSha256(dataToHash);

            AuditLog logEntry = AuditLog.builder()
                    .id(id)
                    .timestamp(timestamp)
                    .actor(actor)
                    .action(action)
                    .target(target)
                    .status(status.length() > 20 ? status.substring(0, 20) : status)
                    .hash(cryptoHash)
                    .build();

            auditLogRepository.save(logEntry);
        } catch (Exception e) {
            // Fail safe logging - ensure main request processing is uninterrupted
            System.err.println("Failed to write audit log: " + e.getMessage());
        }
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            return "HASH_ERROR";
        }
    }
}
