package com.project.micro_realtime.service;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.model.OrderTracking;
import com.project.micro_realtime.repository.TrackingRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
@Log4j2
public class KafkaConsumerService {
    
    private final TrackingRepository trackingRepository;

    @KafkaListener(topics = "order-status-updates", groupId = "delivery-group")
    public void consume(OrderStatusEvent event) {
        log.info("Evento recibido: Pedido {} -> {}", event.getOrderId(), event.getStatus());
        
        // Verificar si el status cambió antes de guardar
        trackingRepository.findTopByOrderIdOrderByTimestampDesc(event.getOrderId())
            .defaultIfEmpty(new OrderTracking()) // Si no existe registro previo
            .flatMap(lastTracking -> {
                // Comparar con el último status
                if (lastTracking.getStatus() == null || 
                    !lastTracking.getStatus().equals(event.getStatus())) {
                    
                    // Status cambió → Guardar nuevo tracking
                    return saveNewTracking(event);
                } else {
                    // Status no cambió → Solo log y no guardar
                    log.info("Status sin cambios para pedido {}. No se guarda tracking.", 
                            event.getOrderId());
                    return Mono.empty();
                }
            })
            .subscribe(); // Importante en métodos void de KafkaListener
    }

    private Mono<OrderTracking> saveNewTracking(OrderStatusEvent event) {
        OrderTracking tracking = new OrderTracking();
        tracking.setOrderId(event.getOrderId());
        tracking.setStatus(event.getStatus());
        tracking.setDriverId(event.getDriverId()); 
        tracking.setLat(event.getLat());
        tracking.setLng(event.getLng());
        tracking.setTimestamp(java.time.LocalDateTime.now()); // Asegurar timestamp

        log.info(" Status cambiado. Guardando nuevo tracking para pedido {}", 
                event.getOrderId());
        
        return trackingRepository.save(tracking)
            .doOnSuccess(saved -> 
                log.info(" Tracking guardado en MongoDB: Pedido {} -> {}", 
                        saved.getOrderId(), saved.getStatus()));
    }
}

