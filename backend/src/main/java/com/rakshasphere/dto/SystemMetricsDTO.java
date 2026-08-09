package com.rakshasphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemMetricsDTO {
    private long activeThreats;
    private long containedToday;
    private long ebpfDropsCount;
    private long activeHoneypots;
    private int systemRiskScore;
    private double networkHealthPct;
    private long ingestedFlowsPerSec;
    private int selfHealingLatencyMs;
}
