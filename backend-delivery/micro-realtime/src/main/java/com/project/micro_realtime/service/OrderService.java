
package com.project.micro_realtime.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.project.micro_realtime.dto.DriverDto;
import com.project.micro_realtime.dto.OrderResponseDto;
import com.project.micro_realtime.dto.RatingRequest;
import com.project.micro_realtime.event.OrderStatusEvent;

import com.project.micro_realtime.feign.DriverClient;
import com.project.micro_realtime.model.Delivery;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.DeliveryRepository;
import com.project.micro_realtime.repository.OrderRepository;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final DeliveryRepository deliveryRepository;
    private final DriverClient driverClient;
    private final KafkaTemplate<String, OrderStatusEvent> kafkaTemplate;
    private final KafkaProducerService kafkaProducerService;
    private final GeocodingService geocodingService;
    private final com.project.micro_realtime.repository.OutboxRepository outboxRepository;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    @org.springframework.transaction.annotation.Transactional
    public Order saveOrderAndOutbox(Order o) {
        Order saved = orderRepository.save(o);
        try {
            com.project.micro_realtime.model.OutboxEvent outboxEvent = com.project.micro_realtime.model.OutboxEvent.builder()
                    .aggregateType("Order")
                    .aggregateId(saved.getId())
                    .eventType("ORDER_CREATED")
                    .payload(objectMapper.writeValueAsString(saved))
                    .status(com.project.micro_realtime.model.OutboxStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .build();
            outboxRepository.save(outboxEvent);
        } catch (Exception e) {
            throw new RuntimeException("Error writing to outbox", e);
        }
        return saved;
    }

    public Mono<Order> createOrder(Order order) {
        return Mono.just(order)
                .flatMap(o -> {
                    // Si hay dirección pero no coordenadas, intentar geocodificar
                    if (o.getDeliveryAddress() != null && o.getDeliveryAddress().getStreet() != null && !o.getDeliveryAddress().getStreet().isEmpty() &&
                            (o.getDeliveryLatitude() == null || o.getDeliveryLatitude() == 0.0)) {
                        return geocodingService.geocode(o.getDeliveryAddress().getStreet())
                                .map(coords -> {
                                    o.setDeliveryLatitude(coords.lat());
                                    o.setDeliveryLongitude(coords.lng());
                                    return o;
                                })
                                .defaultIfEmpty(o);
                    }
                    return Mono.just(o);
                })
                .map(this::saveOrderAndOutbox);
    }

    public Mono<Order> updateOrder(Long id, Order updatedOrder) {
        return Mono.fromCallable(() -> {
            Order existing = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

            // Detectar cambio a EN_CAMINO
            boolean wasEnCamino = existing.getStatus() == OrderStatus.EN_CAMINO;
            boolean willBeEnCamino = updatedOrder.getStatus() == OrderStatus.EN_CAMINO;

            // Detectar cambio de dirección para re-geocodificar
            boolean addressChanged = existing.getDeliveryAddress() != null && updatedOrder.getDeliveryAddress() != null 
                    && !java.util.Objects.equals(existing.getDeliveryAddress().getStreet(), updatedOrder.getDeliveryAddress().getStreet());

            existing.setCustomerName(updatedOrder.getCustomerName());
            existing.setDeliveryAddress(updatedOrder.getDeliveryAddress());
            existing.setStatus(updatedOrder.getStatus());

            return existing;
        })
                .flatMap(existing -> {
                    // Si cambió la dirección, re-geocodificar
                    if (updatedOrder.getDeliveryAddress() != null && updatedOrder.getDeliveryAddress().getStreet() != null && !updatedOrder.getDeliveryAddress().getStreet().isEmpty()) {
                        return geocodingService.geocode(updatedOrder.getDeliveryAddress().getStreet())
                                .map(coords -> {
                                    existing.setDeliveryLatitude(coords.lat());
                                    existing.setDeliveryLongitude(coords.lng());
                                    return existing;
                                })
                                .defaultIfEmpty(existing);
                    }
                    return Mono.just(existing);
                })
                .map(orderRepository::save)
                .doOnSuccess(saved -> {
                    // ENVIAR EVENTO SOLO SI CAMBIA A EN_CAMINO
                    boolean wasEnCamino = saved.getStatus() == OrderStatus.EN_CAMINO; // Simplificado para este ejemplo
                    if (saved.getStatus() == OrderStatus.EN_CAMINO) {
                        OrderStatusEvent event = new OrderStatusEvent(
                                saved.getId(),
                                "EN_CAMINO",
                                "driver-001",
                                LocalDateTime.now(),
                                19.4326,
                                -99.1332,
                                saved.getDeliveryLatitude(), // Asignar destino
                                saved.getDeliveryLongitude() // Asignar destino
                        );
                        kafkaProducerService.sendStatusUpdate(event);
                    }
                });
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

    public Flux<Order> getOrdersByUserId(Long userId) {
        return Flux.fromIterable(orderRepository.findByUserId(userId));
    }

    /**
     * Obtiene las órdenes de un usuario con información enriquecida (delivery +
     * driver)
     */
    public Flux<OrderResponseDto> getOrdersWithDetailsByUserId(Long userId) {
        return Flux.fromIterable(orderRepository.findByUserId(userId))
                .flatMap(order -> {
                    // Crear el DTO base con datos de la orden
                    OrderResponseDto dto = OrderResponseDto.builder()
                            .id(order.getId())
                            .userId(order.getCustomerId())
                            .customerName(order.getCustomerName())
                            .customerEmail(order.getCustomerEmail())
                            .address(order.getDeliveryAddress() != null ? order.getDeliveryAddress().getStreet() : "")
                            // COORDENADAS POR DEFECTO LEJANAS (Sur CDMX) si no están configuradas
                            // Start (Zocalo): 19.4326, -99.1332
                            // End (Sur): 19.3326, -99.1332
                            .destinationLat(order.getDeliveryLatitude() != null && order.getDeliveryLatitude() != 0.0
                                    ? order.getDeliveryLatitude()
                                    : 19.3326)
                            .destinationLng(order.getDeliveryLongitude() != null && order.getDeliveryLongitude() != 0.0
                                    ? order.getDeliveryLongitude()
                                    : -99.1332)
                            .products(order.getItems() != null ? order.getItems().stream().map(item -> {
                                com.project.micro_realtime.dto.ProductDto pdto = new com.project.micro_realtime.dto.ProductDto();
                                pdto.setId(item.getProductId());
                                pdto.setName(item.getProductName());
                                pdto.setPrice(item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0);
                                pdto.setImage(item.getProductImage());
                                return pdto;
                            }).collect(java.util.stream.Collectors.toList()) : new java.util.ArrayList<>())
                            .status(order.getStatus())
                            .rating(order.getRating())
                            .feedback(order.getFeedback())
                            .ratedAt(order.getRatedAt())
                            .build();

                    // Buscar información de delivery (si existe)
                    return Mono
                            .fromCallable(() -> deliveryRepository.findTopByOrderIdOrderByAssignedAtDesc(order.getId()))
                            .flatMap(deliveryOpt -> {
                                if (deliveryOpt.isPresent()) {
                                    Delivery delivery = deliveryOpt.get();
                                    dto.setDriverId(delivery.getDriverId());
                                    dto.setAssignedAt(delivery.getAssignedAt());
                                    dto.setCompletedAt(delivery.getCompletedAt());

                                    // Calcular tiempo de entrega
                                    dto.calculateDeliveryTime();

                                    // Obtener nombre del driver (con manejo de errores)
                                    return Mono.fromCallable(() -> {
                                        try {
                                            DriverDto driver = driverClient.getDriverById(delivery.getDriverId());
                                            dto.setDriverName(driver.getUserEmail()); // Usamos email como nombre por
                                                                                      // ahora
                                            return dto;
                                        } catch (Exception e) {
                                            // Si falla la llamada al servicio de drivers, usar un placeholder
                                            dto.setDriverName("Driver #" + delivery.getDriverId());
                                            return dto;
                                        }
                                    });
                                } else {
                                    // No hay delivery asignado
                                    return Mono.just(dto);
                                }
                            });
                });
    }

    public Mono<Void> deleteOrderById(Long id) {
        return Mono.fromCallable(() -> {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
            orderRepository.deleteById(id);
            return (Void) null;
        });
    }

    // ========== RATING METHOD ==========
    public Mono<Order> rateOrder(Long orderId, RatingRequest ratingRequest) {
        return Mono.fromCallable(() -> {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + orderId));

            // Validar que la orden esté entregada
            if (order.getStatus() != OrderStatus.ENTREGADO) {
                throw new RuntimeException("Solo se pueden calificar órdenes entregadas");
            }

            // Validar que no haya sido calificada previamente
            if (order.getRating() != null) {
                throw new RuntimeException("Esta orden ya ha sido calificada");
            }

            // Asignar calificación
            order.setRating(ratingRequest.getRating());
            order.setFeedback(ratingRequest.getFeedback());
            order.setRatedAt(LocalDateTime.now());

            return orderRepository.save(order);
        });
    }

    public Mono<Order> advanceOrderState(Long id) {
        return Mono.fromCallable(() -> {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + id));
            order.nextState();
            Order saved = orderRepository.save(order);

            if (saved.getStatus() == OrderStatus.EN_CAMINO) {
                OrderStatusEvent event = new OrderStatusEvent(
                        saved.getId(),
                        "EN_CAMINO",
                        "driver-001",
                        LocalDateTime.now(),
                        19.4326,
                        -99.1332,
                        saved.getDeliveryLatitude() != null ? saved.getDeliveryLatitude() : 19.3326,
                        saved.getDeliveryLongitude() != null ? saved.getDeliveryLongitude() : -99.1332
                );
                kafkaProducerService.sendStatusUpdate(event);
            }
            return saved;
        });
    }

    public Mono<Order> cancelOrder(Long id) {
        return Mono.fromCallable(() -> {
            Order order = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + id));
            order.cancelState();
            return orderRepository.save(order);
        });
    }

}
