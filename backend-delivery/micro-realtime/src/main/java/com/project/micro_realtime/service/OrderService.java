package com.project.micro_realtime.service;

import java.time.LocalDateTime;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final KafkaTemplate<String, OrderStatusEvent> kafkaTemplate;
    private final KafkaProducerService kafkaProducerService;

    public Mono<Order> createOrder(Order order) {
        return Mono.fromCallable(() -> orderRepository.save(order))
                .doOnSuccess(saved -> sendEvent(saved.getId(), "CREATED"));
    }

    public Mono<Order> updateOrder(Long id, Order updatedOrder) {
        return Mono.fromCallable(() -> {
            Order existing = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

            // Detectar cambio a EN_CAMINO
            boolean wasEnCamino = existing.getStatus() == OrderStatus.EN_CAMINO;
            boolean willBeEnCamino = updatedOrder.getStatus() == OrderStatus.EN_CAMINO;

            existing.setCustomerName(updatedOrder.getCustomerName());
            existing.setAddress(updatedOrder.getAddress());
            existing.setStatus(updatedOrder.getStatus());

            Order saved = orderRepository.save(existing);
            // ENVIAR EVENTO SOLO SI CAMBIA A EN_CAMINO
            if (!wasEnCamino && willBeEnCamino) {
                OrderStatusEvent event = new OrderStatusEvent(
                        saved.getId(),
                        "EN_CAMINO",
                        "driver-001",
                        LocalDateTime.now(),
                        19.4326,
                        -99.1332);
                kafkaProducerService.sendStatusUpdate(event);
            }
            return saved;
        });
    }

    private void sendEvent(Long orderId, String status) {
        kafkaTemplate.send("order-events", new OrderStatusEvent());
    }

    public Mono<Order> getOrder(Long id) {
        return Mono.fromCallable(() -> orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found")));
    }

    public Flux<Order> getAllOrders() {
        return Flux.fromIterable(orderRepository.findAll());
    }

    public Flux<Order> getAllOrdersCreated() {
        return Flux.fromIterable(orderRepository.findByStatus(OrderStatus.CREATED));
    }

    public Flux<Order> getAllOrdersEnCamino() {
        return Flux.fromIterable(orderRepository.findByStatus(OrderStatus.EN_CAMINO));
    }

    public Flux<Order> getAllOrdersEntregado() {
        return Flux.fromIterable(orderRepository.findByStatus(OrderStatus.ENTREGADO));
    }

    public Flux<Order> getAllOrdersCancelled() {
        return Flux.fromIterable(orderRepository.findByStatus(OrderStatus.CANCELADO));
    }

    public Mono<Void> deleteOrderById(Long id) {
        return Mono.fromCallable(() -> {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
            orderRepository.deleteById(id);
            return (Void) null;
        });
    }

}
