package com.rakshasphere.service;

import com.rakshasphere.model.entity.AlertSeverity;
import org.springframework.stereotype.Service;

@Service
public class RiskEngineService {

    /**
     * Calculates mathematical dynamic risk score (0 - 100) based on quantitative formula:
     * Risk Score = Min(100, [(Severity * Confidence * Asset Criticality) / Defense Mitigation Factor] * 10)
     */
    public int calculateRiskScore(AlertSeverity severity, double confidence, int assetCriticality, int defenseMitigationFactor) {
        int severityWeight = switch (severity) {
            case CRITICAL -> 9;
            case HIGH -> 7;
            case MEDIUM -> 5;
            case LOW -> 3;
            case INFO -> 1;
        };

        double rawScore = ((severityWeight * confidence * assetCriticality) / (double) Math.max(1, defenseMitigationFactor)) * 10.0;
        return (int) Math.min(100, Math.max(0, Math.round(rawScore)));
    }
}
