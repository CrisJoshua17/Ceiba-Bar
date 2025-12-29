package com.project.micro_realtime.repository;

import org.springframework.data.mongodb.repository.Query;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;
import org.springframework.stereotype.Repository;

import com.project.micro_realtime.model.OrderTracking;

import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Repository
public interface TrackingRepository extends ReactiveMongoRepository<OrderTracking, String> {
    
     // Para obtener el historial completo de un pedido
Flux<OrderTracking> findByOrderIdOrderByTimestampAsc(Long orderId);

// Para obtener la última posición de un pedido específico
    Mono<OrderTracking> findTopByOrderIdOrderByTimestampDesc(Long orderId);

    // Opcional: para obtener solo trackings activos (no entregados)
    @Query("{ 'status': { $ne: 'ENTREGADO' } }")
    Flux<OrderTracking> findByStatusNotEntregado();

    // Opcional: para obtener trackings por driver
    Flux<OrderTracking> findByDriverIdOrderByTimestampDesc(String driverId);


}
