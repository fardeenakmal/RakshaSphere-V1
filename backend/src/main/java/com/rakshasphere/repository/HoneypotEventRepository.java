package com.rakshasphere.repository;

import com.rakshasphere.model.entity.HoneypotEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoneypotEventRepository extends JpaRepository<HoneypotEvent, Long> {
    List<HoneypotEvent> findBySessionIdOrderByTimestampAsc(String sessionId);
    long countBySessionId(String sessionId);
}
