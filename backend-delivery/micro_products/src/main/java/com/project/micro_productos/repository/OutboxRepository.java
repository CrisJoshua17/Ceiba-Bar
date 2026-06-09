package com.project.micro_productos.repository;

import com.project.micro_productos.model.OutboxEvent;
import com.project.micro_productos.model.OutboxStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OutboxRepository extends JpaRepository<OutboxEvent, Long> {
    List<OutboxEvent> findByStatusOrderByCreatedAtAsc(OutboxStatus status);
}
