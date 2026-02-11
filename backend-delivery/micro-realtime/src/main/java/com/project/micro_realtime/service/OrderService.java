
package com.project.micro_realtime.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.project.micro_realtime.dto.DriverDto;
import com.project.micro_realtime.dto.OrderResponseDto;
import com.project.micro_realtime.dto.RatingRequest;
import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.feign.AuthClient;
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

    public Mono<Order> createOrder(Order order) {
        return Mono.just(order)
                .flatMap(o -> {
                    // Si hay dirección pero no coordenadas, intentar geocodificar
                    if (o.getAddress() != null && !o.getAddress().isEmpty() &&
                            (o.getDestinationLat() == null || o.getDestinationLat() == 0.0)) {
                        return geocodingService.geocode(o.getAddress())
                                .map(coords -> {
                                    o.setDestinationLat(coords.lat());
                                    o.setDestinationLng(coords.lng());
                                    return o;
                                })
                                .defaultIfEmpty(o);
                    }
                    return Mono.just(o);
                })
                .map(orderRepository::save);
    }

    public Mono<Order> updateOrder(Long id, Order updatedOrder) {
        return Mono.fromCallable(() -> {
            Order existing = orderRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));

            // Detectar cambio a EN_CAMINO
            boolean wasEnCamino = existing.getStatus() == OrderStatus.EN_CAMINO;
            boolean willBeEnCamino = updatedOrder.getStatus() == OrderStatus.EN_CAMINO;

            // Detectar cambio de dirección para re-geocodificar
            boolean addressChanged = !existing.getAddress().equals(updatedOrder.getAddress());

            existing.setCustomerName(updatedOrder.getCustomerName());
            existing.setAddress(updatedOrder.getAddress());
            existing.setStatus(updatedOrder.getStatus());

            return existing;
        })
                .flatMap(existing -> {
                    // Si cambió la dirección, re-geocodificar
                    if (updatedOrder.getAddress() != null && !updatedOrder.getAddress().isEmpty()) {
                        return geocodingService.geocode(updatedOrder.getAddress())
                                .map(coords -> {
                                    existing.setDestinationLat(coords.lat());
                                    existing.setDestinationLng(coords.lng());
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
                                saved.getDestinationLat(), // Asignar destino
                                saved.getDestinationLng() // Asignar destino
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
                            .userId(order.getUserId())
                            .customerName(order.getCustomerName())
                            .customerEmail(order.getCustomerEmail())
                            .address(order.getAddress())
                            // COORDENADAS POR DEFECTO LEJANAS (Sur CDMX) si no están configuradas
                            // Start (Zocalo): 19.4326, -99.1332
                            // End (Sur): 19.3326, -99.1332
                            .destinationLat(order.getDestinationLat() != null && order.getDestinationLat() != 0.0
                                    ? order.getDestinationLat()
                                    : 19.3326)
                            .destinationLng(order.getDestinationLng() != null && order.getDestinationLng() != 0.0
                                    ? order.getDestinationLng()
                                    : -99.1332)
                            .products(order.getProducts())
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

}
