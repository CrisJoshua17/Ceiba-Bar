package com.project.micro_realtime.repository;

import com.project.micro_realtime.model.OutboxEvent;
import com.project.micro_realtime.model.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
