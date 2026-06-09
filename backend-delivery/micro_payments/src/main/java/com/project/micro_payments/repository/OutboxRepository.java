package com.project.micro_payments.repository;

import com.project.micro_payments.model.OutboxEvent;
import com.project.micro_payments.model.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
