package com.rakshasphere.repository;

import com.rakshasphere.model.ServiceHealthEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ServiceHealthEventRepository extends JpaRepository<ServiceHealthEvent, Long> {
}
