package com.project.micro_drivers.repository;

import com.project.micro_drivers.model.OutboxEvent;
import com.project.micro_drivers.model.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
