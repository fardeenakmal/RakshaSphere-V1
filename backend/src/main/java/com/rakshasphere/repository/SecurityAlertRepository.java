package com.rakshasphere.repository;

import com.rakshasphere.model.entity.AlertSeverity;
import com.rakshasphere.model.entity.AlertStatus;
import com.rakshasphere.model.entity.SecurityAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, String> {
    List<SecurityAlert> findTop10ByOrderByTimestampDesc();
    Page<SecurityAlert> findBySeverity(AlertSeverity severity, Pageable pageable);
    Page<SecurityAlert> findByStatus(AlertStatus status, Pageable pageable);
    long countByStatus(AlertStatus status);
}
