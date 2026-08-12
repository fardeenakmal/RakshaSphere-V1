package com.rakshasphere.dto;

import lombok.Data;

@Data
public class HoneypotEventDTO {
    private String sessionId;
    private String eventType;
    private String sourceIp;
    private Integer sourcePort;
    private String timestamp;
    private String username;
    private String password; // received but NEVER stored or logged
    private String command;
    private String rawEventJson;
}
