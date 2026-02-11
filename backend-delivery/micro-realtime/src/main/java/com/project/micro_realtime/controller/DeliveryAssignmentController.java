package com.project.micro_realtime.controller;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_realtime.dto.AssignDriverRequest;
import com.project.micro_realtime.dto.DeliveryDto;
import com.project.micro_realtime.service.DeliveryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/delivery")
@RequiredArgsConstructor
public class DeliveryAssignmentController {

    private final DeliveryService deliveryService;

    /**
     * Asigna un driver a una orden
     */
    @PostMapping("/assign")
    public ResponseEntity<?> assignDriver(@Valid @RequestBody AssignDriverRequest request) {
        try {
            DeliveryDto delivery = deliveryService.assignDriver(request);
            return successResponse("Driver asignado exitosamente", delivery, HttpStatus.CREATED);
        } catch (Exception e) {
            return errorResponse("Error al asignar driver: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Inicia una entrega (driver comienza el viaje)
     */
    @PutMapping("/{id}/start")
    public ResponseEntity<?> startDelivery(@PathVariable Long id) {
        try {
            DeliveryDto delivery = deliveryService.startDelivery(id);
            return successResponse("Entrega iniciada exitosamente", delivery, HttpStatus.OK);
        } catch (Exception e) {
            return errorResponse("Error al iniciar entrega: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Completa una entrega
     */
    @PutMapping("/{id}/complete")
    public ResponseEntity<?> completeDelivery(@PathVariable Long id) {
        try {
            DeliveryDto delivery = deliveryService.completeDelivery(id);
            return successResponse("Entrega completada exitosamente", delivery, HttpStatus.OK);
        } catch (Exception e) {
            return errorResponse("Error al completar entrega: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Cancela una entrega
     */
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelDelivery(@PathVariable Long id) {
        try {
            DeliveryDto delivery = deliveryService.cancelDelivery(id);
            return successResponse("Entrega cancelada exitosamente", delivery, HttpStatus.OK);
        } catch (Exception e) {
            return errorResponse("Error al cancelar entrega: " + e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    /**
     * Obtiene todas las entregas de un driver
     */
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getDriverDeliveries(@PathVariable Long driverId) {
        try {
            List<DeliveryDto> deliveries = deliveryService.getDriverDeliveries(driverId);
            return successResponse("Entregas obtenidas exitosamente", deliveries, HttpStatus.OK);
        } catch (Exception e) {
            return errorResponse("Error al obtener entregas: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Obtiene las entregas activas de un driver
     */
    @GetMapping("/driver/{driverId}/active")
    public ResponseEntity<?> getDriverActiveDeliveries(@PathVariable Long driverId) {
        try {
            List<DeliveryDto> deliveries = deliveryService.getDriverActiveDeliveries(driverId);
            return successResponse("Entregas activas obtenidas exitosamente", deliveries, HttpStatus.OK);
        } catch (Exception e) {
            return errorResponse("Error al obtener entregas activas: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Obtiene el historial de entregas de una orden
     */
    @GetMapping("/order/{orderId}")
    public ResponseEntity<?> getOrderDeliveryHistory(@PathVariable Long orderId) {
        try {
            List<DeliveryDto> deliveries = deliveryService.getOrderDeliveryHistory(orderId);
            return successResponse("Historial de entregas obtenido exitosamente", deliveries, HttpStatus.OK);
        } catch (Exception e) {
            return errorResponse("Error al obtener historial: " + e.getMessage(), HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Métodos auxiliares para respuestas consistentes
    private ResponseEntity<?> successResponse(String message, Object data, HttpStatus status) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        response.put("data", data);
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        return ResponseEntity.status(status).body(response);
    }

    private ResponseEntity<?> errorResponse(String message, HttpStatus status) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("timestamp", LocalDateTime.now());
        response.put("status", status.value());
        return ResponseEntity.status(status).body(response);
    }
}
