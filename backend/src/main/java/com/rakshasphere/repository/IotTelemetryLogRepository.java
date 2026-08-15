package com.rakshasphere.repository;

import com.rakshasphere.model.entity.IotTelemetryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IotTelemetryLogRepository extends JpaRepository<IotTelemetryLog, Long> {
    List<IotTelemetryLog> findTop20ByDeviceIdOrderByTimestampDesc(String deviceId);
}
