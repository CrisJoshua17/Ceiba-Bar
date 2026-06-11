package com.project.micro_realtime.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.micro_realtime.dto.AssignDriverRequest;
import com.project.micro_realtime.dto.DeliveryDto;
import com.project.micro_realtime.dto.DriverDto;
import com.project.micro_realtime.dto.LatLng;
import com.project.micro_realtime.feign.DriverClient;
import com.project.micro_realtime.model.Delivery;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.DeliveryRepository;
import com.project.micro_realtime.repository.OrderRepository;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final DriverClient driverClient;
    private final GeocodingService geocodingService;

    /**
     * Asigna un driver a una orden y cambia el estado a PREPARING
     */
    @Transactional
    public DeliveryDto assignDriver(AssignDriverRequest request) {
        // Validar que la orden existe
        Long orderId = request.getOrderId();
        if (orderId == null)
            throw new IllegalArgumentException("Order ID cannot be null");

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + orderId));

        // Validar que la orden está en estado CREATED o PREPARING para asignar/reasignar
        if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.PREPARING) {
            throw new RuntimeException("La orden debe estar en estado CREATED o PREPARING para asignar un driver");
        }

        // Cancelar/limpiar entregas anteriores no completadas para la misma orden
        List<Delivery> existingDeliveries = deliveryRepository.findByOrderId(orderId);
        if (existingDeliveries != null) {
            for (Delivery d : existingDeliveries) {
                if (d.getCompletedAt() == null) {
                    d.setCompletedAt(LocalDateTime.now());
                    d.setNotes("Cancelada por reasignación de conductor");
                    deliveryRepository.save(d);
                }
            }
        }

        // Crear la entrega
        Delivery delivery = new Delivery();
        delivery.setOrder(order);
        delivery.setDriverId(request.getDriverId());
        delivery.setNotes(request.getNotes());
        delivery.setAssignedAt(LocalDateTime.now());
        delivery.setPickupLatitude(19.4326);
        delivery.setPickupLongitude(-99.1332);
        delivery.setStatus(com.project.micro_realtime.model.DeliveryStatus.ASSIGNED);

        // Obtener coordenadas de la dirección del cliente si aún no las tiene
        if ((order.getDeliveryLatitude() == null || order.getDeliveryLatitude() == 0) &&
                order.getDeliveryAddress() != null && order.getDeliveryAddress().getStreet() != null && !order.getDeliveryAddress().getStreet().trim().isEmpty()) {
            try {
                // Bloquear y obtener coordenadas explícitamente
                LatLng coords = geocodingService.geocode(order.getDeliveryAddress().getStreet()).block();

                if (coords != null) {
                    order.setDeliveryLatitude(coords.lat());
                    order.setDeliveryLongitude(coords.lng());

                    // Asignar también a la delivery
                    delivery.setDeliveryLatitude(coords.lat());
                    delivery.setDeliveryLongitude(coords.lng());

                    System.out.println(" Coordenadas obtenidas y guardadas: " + coords.lat() + ", " + coords.lng());
                } else {
                    System.err.println(" Geocoding retornó null para: " + (order.getDeliveryAddress() != null ? order.getDeliveryAddress().getStreet() : ""));
                }
            } catch (Exception e) {
                System.err.println("Error en geocoding: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            // Si ya tenía coordenadas, copiarlas a la delivery
            delivery.setDeliveryLatitude(order.getDeliveryLatitude());
            delivery.setDeliveryLongitude(order.getDeliveryLongitude());
        }

        Delivery savedDelivery = deliveryRepository.save(delivery);

        // Actualizar el estado de la orden a PREPARING y asociar el conductor
        order.setDriverId(request.getDriverId());
        order.setStatus(OrderStatus.PREPARING);
        orderRepository.save(order);

        // Obtener información del driver para enriquecer el DTO
        return enrichDeliveryDto(savedDelivery, order);
    }

    /**
     * Inicia una entrega (el driver comienza el viaje)
     */
    @Transactional
    public DeliveryDto startDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Entrega no encontrada con ID: " + deliveryId));

        // Validar que no haya sido completada
        if (delivery.getCompletedAt() != null) {
            throw new RuntimeException("La entrega ya fue completada");
        }

        delivery.setStartedAt(LocalDateTime.now());
        delivery.setStatus(com.project.micro_realtime.model.DeliveryStatus.ON_THE_WAY);
        Delivery savedDelivery = deliveryRepository.save(delivery);

        Order order = delivery.getOrder();
        if (order != null) {
            order.setStatus(OrderStatus.EN_CAMINO);
            orderRepository.save(order);
        }
        return enrichDeliveryDto(savedDelivery, order);
    }

    /**
     * Completa una entrega y marca la orden como ENTREGADO
     */
    @Transactional
    public DeliveryDto completeDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Entrega no encontrada con ID: " + deliveryId));

        delivery.setCompletedAt(LocalDateTime.now());
        Delivery savedDelivery = deliveryRepository.save(delivery);

        // Actualizar orden
        Order order = delivery.getOrder();
        if (order == null) throw new RuntimeException("Orden no encontrada");
        order.setStatus(OrderStatus.ENTREGADO);
        orderRepository.save(order);

        // Incrementar contador de entregas del driver con resiliencia
        try {
            callIncrementDeliveries(delivery.getDriverId());
        } catch (Exception e) {
            // Log error pero no fallar la transacción
            log.error("Error incrementando entregas del driver: {}", e.getMessage());
        }

        return enrichDeliveryDto(savedDelivery, order);
    }

    /**
     * Cancela una entrega y marca la orden como CANCELADO
     */
    @Transactional
    public DeliveryDto cancelDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new RuntimeException("Entrega no encontrada con ID: " + deliveryId));

        delivery.setCompletedAt(LocalDateTime.now());
        Delivery savedDelivery = deliveryRepository.save(delivery);

        // Actualizar orden
        Order order = delivery.getOrder();
        if (order == null) throw new RuntimeException("Orden no encontrada");
        order.setStatus(OrderStatus.CANCELADO);
        orderRepository.save(order);

        return enrichDeliveryDto(savedDelivery, order);
    }

    /**
     * Obtiene todas las entregas de un driver
     */
    @Transactional(readOnly = true)
    public List<DeliveryDto> getDriverDeliveries(Long driverId) {
        if (driverId == null)
            throw new IllegalArgumentException("Driver ID cannot be null");
        List<Delivery> deliveries = deliveryRepository.findByDriverId(driverId);
        return deliveries.stream()
                .map(delivery -> {
                    Order order = delivery.getOrder();
                    return enrichDeliveryDto(delivery, order);
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtiene las entregas activas de un driver (no completadas)
     */
    @Transactional(readOnly = true)
    public List<DeliveryDto> getDriverActiveDeliveries(Long driverId) {
        if (driverId == null)
            throw new IllegalArgumentException("Driver ID cannot be null");
        List<Delivery> deliveries = deliveryRepository.findByDriverId(driverId);
        return deliveries.stream()
                .filter(delivery -> delivery.getCompletedAt() == null) // Solo las no completadas
                .map(delivery -> {
                    Order order = delivery.getOrder();
                    return enrichDeliveryDto(delivery, order);
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el historial de entregas de una orden
     */
    @Transactional(readOnly = true)
    public List<DeliveryDto> getOrderDeliveryHistory(Long orderId) {
        List<Delivery> deliveries = deliveryRepository.findByOrderId(orderId);
        Order order = orderRepository.findById(orderId).orElse(null);

        return deliveries.stream()
                .map(delivery -> enrichDeliveryDto(delivery, order))
                .collect(Collectors.toList());
    }

    /**
     * Enriquece el DTO con información del driver y la orden
     */
    private DeliveryDto enrichDeliveryDto(Delivery delivery, Order order) {
        DeliveryDto dto = new DeliveryDto();
        dto.setId(delivery.getId());
        dto.setOrderId(delivery.getOrder() != null ? delivery.getOrder().getId() : null);
        dto.setDriverId(delivery.getDriverId());
        dto.setAssignedAt(delivery.getAssignedAt());
        dto.setStartedAt(delivery.getStartedAt());
        dto.setCompletedAt(delivery.getCompletedAt());
        dto.setNotes(delivery.getNotes());

        // El status viene de la orden, no de la entrega
        if (order != null) {
            dto.setStatus(order.getStatus());
        }

        // Obtener información del driver con resiliencia
        try {
            DriverDto driver = callGetDriverById(delivery.getDriverId());
            dto.setDriverEmail(driver.getUserEmail());
            dto.setDriverRating(driver.getRating());
            dto.setDriverTotalDeliveries(driver.getTotalDeliveries());
        } catch (Exception e) {
            // Si falla, continuar sin datos del driver
            log.warn("No se pudieron obtener datos del driver {}: {}", delivery.getDriverId(), e.getMessage());
        }

        if (order != null) {
            dto.setCustomerName(order.getCustomerName());
            dto.setCustomerEmail(order.getCustomerEmail());
            dto.setAddress(order.getDeliveryAddress() != null ? order.getDeliveryAddress().getStreet() : "");
            dto.setProducts(order.getItems() != null ? order.getItems().stream().map(item -> {
                com.project.micro_realtime.dto.ProductDto pdto = new com.project.micro_realtime.dto.ProductDto();
                pdto.setId(item.getProductId());
                pdto.setName(item.getProductName());
                pdto.setPrice(item.getUnitPrice() != null ? item.getUnitPrice().doubleValue() : 0.0);
                pdto.setImage(item.getProductImage());
                return pdto;
            }).collect(Collectors.toList()) : new java.util.ArrayList<>());
        }

        return dto;
    }

    // ======================== Métodos de Resiliencia (Resilience4j) ========================

    /**
     * Obtiene un driver con protección de CircuitBreaker, Retry y Bulkhead.
     */
    @CircuitBreaker(name = "driverClient", fallbackMethod = "fallbackGetDriver")
    @Retry(name = "driverClient")
    @Bulkhead(name = "driverClient")
    public DriverDto callGetDriverById(Long driverId) {
        return driverClient.getDriverById(driverId);
    }

    /**
     * Fallback: devuelve DriverDto vacío para no bloquear el enriquecimiento del DTO de entrega.
     */
    public DriverDto fallbackGetDriver(Long driverId, Throwable t) {
        log.error("[Resilience4j] Fallback getDriver para driverId={}. Razón: {}", driverId, t.getMessage());
        return new DriverDto(); // DTO vacío sin bloquear el flujo
    }

    /**
     * Incrementa entregas del driver con protección de CircuitBreaker, Retry y Bulkhead.
     */
    @CircuitBreaker(name = "driverClient", fallbackMethod = "fallbackIncrementDeliveries")
    @Retry(name = "driverClient")
    @Bulkhead(name = "driverClient")
    public void callIncrementDeliveries(Long driverId) {
        driverClient.incrementDeliveries(driverId);
    }

    /**
     * Fallback: registra la operación pendiente para reintento asíncrono cuando micro-drivers se recupere.
     */
    public void fallbackIncrementDeliveries(Long driverId, Throwable t) {
        log.error("[Resilience4j] Fallback incrementDeliveries para driverId={}. Razón: {}", driverId, t.getMessage());
        // TODO: Guardar operación pendiente en tabla `pending_driver_ops` para procesamiento posterior
    }
}
