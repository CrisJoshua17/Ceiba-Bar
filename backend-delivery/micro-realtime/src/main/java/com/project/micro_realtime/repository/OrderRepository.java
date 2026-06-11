package com.project.micro_realtime.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @EntityGraph(attributePaths = {"items"})
    List<Order> findAll();

    @EntityGraph(attributePaths = {"items"})
    Optional<Order> findById(Long id);

    @EntityGraph(attributePaths = {"items"})
    List<Order> findByStatus(OrderStatus status);

    @EntityGraph(attributePaths = {"items"})
    List<Order> findByCustomerId(Long customerId);

}
