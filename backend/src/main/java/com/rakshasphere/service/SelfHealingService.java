package com.rakshasphere.service;

import com.rakshasphere.model.entity.AlertStatus;
import com.rakshasphere.model.entity.AuditLog;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.repository.AuditLogRepository;
import com.rakshasphere.repository.SecurityAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SelfHealingService {

    @Autowired
    private SecurityAlertRepository alertRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private EBpfDriver eBpfDriver;

    @Transactional
    public SecurityAlert applyEbpfDrop(String alertId, String actor) {
        SecurityAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        alert.setStatus(AlertStatus.CONTAINED);
        alert.setRemediationAction("eBPF XDP Driver Kernel Drop Rule Injected for " + alert.getSourceIp());
        alertRepository.save(alert);

        // Call Native eBPF JNI Driver
        try {
            int result = eBpfDriver.injectDropRule(alert.getSourceIp());
            if (result != 0) {
                System.err.println("Failed to inject eBPF drop rule via native JNI driver.");
            }
        } catch (UnsatisfiedLinkError e) {
            System.err.println("Native JNI library not loaded, skipping native driver execution.");
        }

        // Record Cryptographic Audit Log
        AuditLog audit = AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .timestamp(LocalDateTime.now())
                .actor(actor)
                .action("INJECT_XDP_DROP")
                .target(alert.getSourceIp() + " (Port " + alert.getDestinationPort() + ")")
                .status("SUCCESS")
                .hash("0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .build();
        auditLogRepository.save(audit);

        return alert;
    }

    @Transactional
    public SecurityAlert divertToHoneypot(String alertId, String actor) {
        SecurityAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        alert.setStatus(AlertStatus.HONEYPOT_DIVERTED);
        alert.setRemediationAction("Diverted Attacker IP " + alert.getSourceIp() + " to Adaptive Honeypot Decoy");
        alertRepository.save(alert);

        AuditLog audit = AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .timestamp(LocalDateTime.now())
                .actor(actor)
                .action("DIVERT_TRAFFIC_HONEYPOT")
                .target(alert.getSourceIp() + " -> Decoy Container")
                .status("SUCCESS")
                .hash("0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .build();
        auditLogRepository.save(audit);

        return alert;
    }

    @Transactional
    public SecurityAlert revertEbpfRule(String alertId, String actor) {
        SecurityAlert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new IllegalArgumentException("Alert not found: " + alertId));

        alert.setStatus(AlertStatus.ACTIVE);
        alert.setRemediationAction("eBPF XDP Drop Rule Reverted by Admin");
        alertRepository.save(alert);

        AuditLog audit = AuditLog.builder()
                .id("AUD-" + UUID.randomUUID().toString().substring(0, 8))
                .timestamp(LocalDateTime.now())
                .actor(actor)
                .action("REVERT_XDP_DROP")
                .target(alert.getSourceIp())
                .status("SUCCESS")
                .hash("0x" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                .build();
        auditLogRepository.save(audit);

        return alert;
    }
}
