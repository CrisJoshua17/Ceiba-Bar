package com.project.micro_realtime.controller;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.micro_realtime.dto.OrderResponseDto;
import com.project.micro_realtime.feign.AuthClient;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.service.OrderService;

import lombok.RequiredArgsConstructor;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public Mono<ResponseEntity<?>> create(@RequestBody Order order) {
        return orderService.createOrder(order)
                .flatMap(
                        createdOrder -> successResponse("Orden creada exitosamente", createdOrder, HttpStatus.CREATED));
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<?>> get(@PathVariable Long id) {
        return orderService.getOrder(id)
                .flatMap(order -> successResponse("Orden encontrada", order, HttpStatus.OK))
                .switchIfEmpty(Mono.error(new RuntimeException("Orden no encontrada con ID: " + id)));
    }

    @GetMapping("/{id}/verify")
    public Mono<ResponseEntity<?>> verify(@PathVariable Long id,
            @RequestParam String email) {
        return orderService.getOrder(id)
                .flatMap(order -> {
                    if (email.equalsIgnoreCase(order.getCustomerEmail())) {
                        return successResponse("Identidad verificada", true, HttpStatus.OK);
                    } else {
                        return Mono.error(new RuntimeException("El email no coincide con el registro del pedido"));
                    }
                })
                .switchIfEmpty(Mono.error(new RuntimeException("Orden no encontrada")));
    }

    @GetMapping("/all")
    public Mono<ResponseEntity<?>> getAll() {
        return orderService.getAllOrders()
                .collectList()
                .flatMap(orders -> successResponse("Órdenes obtenidas exitosamente", orders, HttpStatus.OK))
                .switchIfEmpty(successResponse("No hay órdenes registradas", new HashMap<>(), HttpStatus.OK));
    }

    @GetMapping("/status/{status}")
    public Mono<ResponseEntity<?>> getAllOrdersByStatus(@PathVariable String status) {
        switch (status) {
            case "CREATED":
                return orderService.getAllOrdersCreated()
                        .collectList()
                        .flatMap(orders -> successResponse("Órdenes obtenidas exitosamente", orders, HttpStatus.OK))
                        .switchIfEmpty(successResponse("No hay órdenes registradas", new HashMap<>(), HttpStatus.OK));

            case "EN_CAMINO":
                return orderService.getAllOrdersEnCamino()
                        .collectList()
                        .flatMap(orders -> successResponse("Órdenes obtenidas exitosamente", orders, HttpStatus.OK))
                        .switchIfEmpty(successResponse("No hay órdenes registradas", new HashMap<>(), HttpStatus.OK));

            case "ENTREGADO":
                return orderService.getAllOrdersEntregado()
                        .collectList()
                        .flatMap(orders -> successResponse("Órdenes obtenidas exitosamente", orders, HttpStatus.OK))
                        .switchIfEmpty(successResponse("No hay órdenes registradas", new HashMap<>(), HttpStatus.OK));

            case "CANCELADO":
                return orderService.getAllOrdersCancelled()
                        .collectList()
                        .flatMap(orders -> successResponse("Órdenes obtenidas exitosamente", orders, HttpStatus.OK))
                        .switchIfEmpty(successResponse("No hay órdenes registradas", new HashMap<>(), HttpStatus.OK));

            default:
                return errorResponse("Estado no válido", HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/user/{userId}")
    public Mono<ResponseEntity<?>> getByUserId(@PathVariable Long userId) {
        return orderService.getOrdersWithDetailsByUserId(userId)
                .collectList()
                .flatMap(orders -> successResponse("Órdenes del usuario obtenidas", orders, HttpStatus.OK))
                .switchIfEmpty(successResponse("No hay órdenes para este usuario", new ArrayList<>(), HttpStatus.OK));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<?>> update(@PathVariable Long id, @RequestBody Order order) {
        return orderService.updateOrder(id, order)
                .flatMap(updatedOrder -> successResponse("Orden actualizada exitosamente", updatedOrder, HttpStatus.OK))
                .switchIfEmpty(errorResponse("Orden no encontrada con ID: " + id, HttpStatus.NOT_FOUND))
                .onErrorResume(e -> errorResponse("Error al actualizar la orden: " + e.getMessage(),
                        HttpStatus.INTERNAL_SERVER_ERROR));
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<?>> delete(@PathVariable Long id) {
        return orderService.deleteOrderById(id)
                .then(successResponse("Orden eliminada exitosamente", null, HttpStatus.NO_CONTENT))
                .switchIfEmpty(errorResponse("Orden no encontrada con ID: " + id, HttpStatus.NOT_FOUND))
                .onErrorResume(e -> errorResponse("Error al eliminar la orden: " + e.getMessage(),
                        HttpStatus.INTERNAL_SERVER_ERROR));
    }

    // ========== RATING ENDPOINT ==========
    @PostMapping("/{id}/rate")
    public Mono<ResponseEntity<?>> rateOrder(@PathVariable Long id,
            @RequestBody com.project.micro_realtime.dto.RatingRequest ratingRequest) {
        return orderService.rateOrder(id, ratingRequest)
                .flatMap(ratedOrder -> successResponse("Calificación registrada exitosamente", ratedOrder,
                        HttpStatus.OK))
                .onErrorResume(e -> errorResponse(e.getMessage(), HttpStatus.BAD_REQUEST));
    }

    private Mono<ResponseEntity<?>> successResponse(String message, Object data, HttpStatus status) {
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", message);
            response.put("data", data);
            response.put("timestamp", LocalDateTime.now());
            response.put("status", status.value());
            return ResponseEntity.status(status).body(response);
        });
    }

    private Mono<ResponseEntity<?>> errorResponse(String message, HttpStatus status) {
        return Mono.fromCallable(() -> {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", message);
            response.put("timestamp", LocalDateTime.now());
            response.put("status", status.value());
            return ResponseEntity.status(status).body(response);
        });
    }
}