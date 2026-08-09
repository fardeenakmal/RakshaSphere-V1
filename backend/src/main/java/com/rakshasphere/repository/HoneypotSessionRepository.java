package com.rakshasphere.repository;

import com.rakshasphere.model.entity.HoneypotSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HoneypotSessionRepository extends JpaRepository<HoneypotSession, String> {
    List<HoneypotSession> findByStatus(String status);
}
