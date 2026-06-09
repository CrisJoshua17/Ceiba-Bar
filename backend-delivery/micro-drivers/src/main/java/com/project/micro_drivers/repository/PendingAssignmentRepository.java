package com.project.micro_drivers.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.project.micro_drivers.model.PendingAssignment;

@Repository
public interface PendingAssignmentRepository extends JpaRepository<PendingAssignment, Long> {
    List<PendingAssignment> findAllByOrderByCreatedAtAsc();
}
