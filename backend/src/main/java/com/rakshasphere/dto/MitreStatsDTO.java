package com.rakshasphere.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MitreStatsDTO {
    private String techniqueId;
    private long eventCount;
    private LocalDateTime firstSeen;
    private LocalDateTime lastSeen;
    private String highestSeverity;
    private long criticalCount;
    private long highCount;
    private long mediumCount;
    private long lowCount;
}
