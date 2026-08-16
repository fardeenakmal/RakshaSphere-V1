package com.rakshasphere.service;

import com.rakshasphere.dto.MitreStatsDTO;
import com.rakshasphere.model.entity.AlertSeverity;
import com.rakshasphere.model.entity.SecurityAlert;
import com.rakshasphere.repository.SecurityAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MitreService {

    @Autowired
    private SecurityAlertRepository alertRepository;

    public List<MitreStatsDTO> getMatrixStats() {
        List<SecurityAlert> allAlerts = alertRepository.findAll();
        Map<String, List<SecurityAlert>> alertsByMitreId = allAlerts.stream()
                .filter(a -> a.getMitreId() != null && !a.getMitreId().isBlank() && !a.getMitreId().equalsIgnoreCase("NONE") && !a.getMitreId().equalsIgnoreCase("T0000"))
                .collect(Collectors.groupingBy(SecurityAlert::getMitreId));


        List<MitreStatsDTO> statsList = new ArrayList<>();
        for (Map.Entry<String, List<SecurityAlert>> entry : alertsByMitreId.entrySet()) {
            String mitreId = entry.getKey();
            List<SecurityAlert> alerts = entry.getValue();
            statsList.add(computeStatsForAlerts(mitreId, alerts));
        }

        return statsList;
    }

    public MitreStatsDTO getStatsForTechnique(String mitreId) {
        List<SecurityAlert> alerts = alertRepository.findByMitreIdOrderByTimestampDesc(mitreId);
        return computeStatsForAlerts(mitreId, alerts);
    }

    public List<SecurityAlert> getAlertsForTechnique(String mitreId) {
        return alertRepository.findByMitreIdOrderByTimestampDesc(mitreId);
    }

    private MitreStatsDTO computeStatsForAlerts(String mitreId, List<SecurityAlert> alerts) {
        if (alerts == null || alerts.isEmpty()) {
            return MitreStatsDTO.builder()
                    .techniqueId(mitreId)
                    .eventCount(0)
                    .firstSeen(null)
                    .lastSeen(null)
                    .highestSeverity("NOMINAL")
                    .criticalCount(0)
                    .highCount(0)
                    .mediumCount(0)
                    .lowCount(0)
                    .build();
        }

        long count = alerts.size();
        LocalDateTime firstSeen = alerts.stream().map(SecurityAlert::getTimestamp).min(LocalDateTime::compareTo).orElse(null);
        LocalDateTime lastSeen = alerts.stream().map(SecurityAlert::getTimestamp).max(LocalDateTime::compareTo).orElse(null);

        long critical = alerts.stream().filter(a -> a.getSeverity() == AlertSeverity.CRITICAL).count();
        long high = alerts.stream().filter(a -> a.getSeverity() == AlertSeverity.HIGH).count();
        long medium = alerts.stream().filter(a -> a.getSeverity() == AlertSeverity.MEDIUM).count();
        long low = alerts.stream().filter(a -> a.getSeverity() == AlertSeverity.LOW).count();

        String highestSeverity = "LOW";
        if (critical > 0) {
            highestSeverity = "CRITICAL";
        } else if (high > 0) {
            highestSeverity = "HIGH";
        } else if (medium > 0) {
            highestSeverity = "MEDIUM";
        }

        return MitreStatsDTO.builder()
                .techniqueId(mitreId)
                .eventCount(count)
                .firstSeen(firstSeen)
                .lastSeen(lastSeen)
                .highestSeverity(highestSeverity)
                .criticalCount(critical)
                .highCount(high)
                .mediumCount(medium)
                .lowCount(low)
                .build();
    }
}
