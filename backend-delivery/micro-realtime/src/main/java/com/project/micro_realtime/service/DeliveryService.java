package com.project.micro_realtime.service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.micro_realtime.dto.AssignDriverRequest;
import com.project.micro_realtime.dto.DeliveryDto;
import com.project.micro_realtime.dto.DriverDto;
import com.project.micro_realtime.feign.DriverClient;
import com.project.micro_realtime.model.Delivery;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.DeliveryRepository;
import com.project.micro_realtime.repository.OrderRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final OrderRepository orderRepository;
    private final DriverClient driverClient;
    private final GeocodingService geocodingService;

    /**
     * Asigna un driver a una orden y cambia el estado a EN_CAMINO
     */
    @Transactional
    public DeliveryDto assignDriver(AssignDriverRequest request) {
        // Validar que la orden existe
        Order order = orderRepository.findById(request.getOrderId())
                .orElseThrow(() -> new RuntimeException("Orden no encontrada con ID: " + request.getOrderId()));

        // Validar que la orden está en estado CREATED o PAGADO
        if (order.getStatus() != OrderStatus.CREATED && order.getStatus() != OrderStatus.PREPARING) {
            throw new RuntimeException("La orden debe estar en estado CREATED o PREPARING para asignar un driver");
        }

        // Crear la entrega
        Delivery delivery = new Delivery();
        delivery.setOrderId(request.getOrderId());
        delivery.setDriverId(request.getDriverId());
        delivery.setNotes(request.getNotes());

        // Obtener coordenadas de la dirección del cliente si aún no las tiene
        if ((order.getDestinationLat() == null || order.getDestinationLat() == 0) &&
                order.getAddress() != null && !order.getAddress().trim().isEmpty()) {
            try {
                geocodingService.geocode(order.getAddress())
                        .doOnNext(coords -> {
                            order.setDestinationLat(coords.lat());
                            order.setDestinationLng(coords.lng());
                            System.out.println(" Coordenadas obtenidas para: " + order.getAddress() +
                                    " -> (" + coords.lat() + ", " + coords.lng() + ")");
                        })
                        .doOnError(error -> {
                            System.err.println(" No se pudieron obtener coordenadas para: " + order.getAddress());
                        })
                        .block(); // Bloquear para esperar el resultado antes de guardar
            } catch (Exception e) {
                System.err.println("Error en geocoding, continuando sin coordenadas: " + e.getMessage());
            }
        }

        Delivery savedDelivery = deliveryRepository.save(delivery);

        // Actualizar el estado de la orden a EN_CAMINO
        order.setStatus(OrderStatus.EN_CAMINO);
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
        Delivery savedDelivery = deliveryRepository.save(delivery);

        Order order = orderRepository.findById(delivery.getOrderId()).orElse(null);
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
        Order order = orderRepository.findById(delivery.getOrderId())
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        order.setStatus(OrderStatus.ENTREGADO);
        orderRepository.save(order);

        // Incrementar contador de entregas del driver
        try {
            driverClient.incrementDeliveries(delivery.getDriverId());
        } catch (Exception e) {
            // Log error pero no fallar la transacción
            System.err.println("Error incrementando entregas del driver: " + e.getMessage());
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
        Order order = orderRepository.findById(delivery.getOrderId())
                .orElseThrow(() -> new RuntimeException("Orden no encontrada"));
        order.setStatus(OrderStatus.CANCELADO);
        orderRepository.save(order);

        return enrichDeliveryDto(savedDelivery, order);
    }

    /**
     * Obtiene todas las entregas de un driver
     */
    public List<DeliveryDto> getDriverDeliveries(Long driverId) {
        List<Delivery> deliveries = deliveryRepository.findByDriverId(driverId);
        return deliveries.stream()
                .map(delivery -> {
                    Order order = orderRepository.findById(delivery.getOrderId()).orElse(null);
                    return enrichDeliveryDto(delivery, order);
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtiene las entregas activas de un driver (no completadas)
     */
    public List<DeliveryDto> getDriverActiveDeliveries(Long driverId) {
        List<Delivery> deliveries = deliveryRepository.findByDriverId(driverId);
        return deliveries.stream()
                .filter(delivery -> delivery.getCompletedAt() == null) // Solo las no completadas
                .map(delivery -> {
                    Order order = orderRepository.findById(delivery.getOrderId()).orElse(null);
                    return enrichDeliveryDto(delivery, order);
                })
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el historial de entregas de una orden
     */
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
        dto.setOrderId(delivery.getOrderId());
        dto.setDriverId(delivery.getDriverId());
        dto.setAssignedAt(delivery.getAssignedAt());
        dto.setStartedAt(delivery.getStartedAt());
        dto.setCompletedAt(delivery.getCompletedAt());
        dto.setNotes(delivery.getNotes());

        // El status viene de la orden, no de la entrega
        if (order != null) {
            dto.setStatus(order.getStatus());
        }

        // Obtener información del driver
        try {
            DriverDto driver = driverClient.getDriverById(delivery.getDriverId());
            dto.setDriverEmail(driver.getUserEmail());
            dto.setDriverRating(driver.getRating());
            dto.setDriverTotalDeliveries(driver.getTotalDeliveries());
        } catch (Exception e) {
            // Si falla, continuar sin datos del driver
            System.err.println("Error obteniendo datos del driver: " + e.getMessage());
        }

        // Agregar información básica de la orden si existe
        if (order != null) {
            dto.setCustomerName(order.getCustomerName());
            dto.setCustomerEmail(order.getCustomerEmail());
            dto.setAddress(order.getAddress());
        }

        return dto;
    }
}
