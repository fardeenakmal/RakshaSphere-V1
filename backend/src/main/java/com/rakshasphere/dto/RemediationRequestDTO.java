package com.rakshasphere.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RemediationRequestDTO {
    @NotBlank(message = "Alert ID is required")
    private String alertId;

    private String actionType; // eBPF_DROP, IPTABLES_BLOCK, REVERT_BLOCK, DIVERT_HONEYPOT
    private String reason;
}
