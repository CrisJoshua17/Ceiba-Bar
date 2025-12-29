package com.project.micro_realtime.util;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.project.micro_realtime.event.OrderStatusEvent;
import com.project.micro_realtime.model.Order;
import com.project.micro_realtime.model.OrderStatus;
import com.project.micro_realtime.repository.OrderRepository;
import com.project.micro_realtime.service.KafkaProducerService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@Component
@RequiredArgsConstructor
@Log4j2
public class LocationSimulator {
    
   private final KafkaProducerService kafkaProducerService;
   private final OrderRepository orderRepository;

   private Long currentOrderId = null;
   private boolean isMoving = false;
   private double currentLat = 19.4326;
   private double currentLng = -99.1332;


   @Scheduled(fixedRate = 3000)
   public void simulateMovement(){
    if(isMoving){
        log.debug("Simulacion en progreso, esperando...");
        return;
    }
    isMoving = true;

    log.info("Iniciando simulacion de movimiento...");

    Mono.fromCallable( ()-> orderRepository.findByStatus(OrderStatus.EN_CAMINO))
    .subscribeOn(Schedulers.boundedElastic())
    .flatMap(orders ->{
        log.info("Pedidos EN_CAMINO encontrados: {}",orders.size());
      if(orders.isEmpty()){
        log.info("No hay pedidos EN_CAMINO");
        isMoving = false;
        return Mono.empty();
      }
      Order order = orders.get(0);
      log.info("Procesando pedido ID: {}", order.getId());

      // Verificar si es un pedido nuevo
      if(currentOrderId == null || !currentOrderId.equals(order.getId())){
        log.info("NUEVO PEDIDO DETECTADO: {}",order.getId());
        currentOrderId = order.getId();
        // Reiniciar a posición inicial para nuevo pedido
         currentLat = 19.4326;
                    currentLng = -99.1332;
                    log.info("📍 INICIANDO DESDE LOCACION DEFAULT: ({}, {})", currentLat, currentLng);
      }else{
          log.info("➡️ CONTINUANDO PEDIDO EXISTENTE: {}", currentOrderId);
      }
        return processMovement(order);
    })
    
    .doFinally(signal -> isMoving=false)
    .subscribe();
    
}





    private Mono<String> processMovement(Order order){
      double targetLat = order.getDestinationLat();
      double targetLng = order.getDestinationLng();
     
       // Validar coordenadas de destino
       if (targetLat == 0.0 || targetLng == 0.0) {
            log.warn("⚠️ Pedido {} sin coordenadas de destino válidas", order.getId());
            return Mono.just("Sin destino válido");
        }
          // Calcular distancia
        double distance = haversine(currentLat, currentLng, targetLat, targetLng);
        log.info("📏 Distancia al destino: {} km", String.format("%.4f", distance));
        
        // Verificar si llegó
        if (distance < 0.05) {
            log.info("🎉 ¡Pedido {} entregado! Distancia: {} km", order.getId(), String.format("%.4f", distance));
            return markAsDelivered(order.getId(), targetLat, targetLng);
        }
         // Calcular nueva posición
        double fraction = 0.15;
        double newLat = currentLat + (targetLat - currentLat) * fraction;
        double newLng = currentLng + (targetLng - currentLng) * fraction;
        
        // Actualizar posición actual
        currentLat = newLat;
        currentLng = newLng;
        
        log.info("📍 NUEVA POSICIÓN: ({}, {}) → Distancia restante: {} km", 
            String.format("%.6f", currentLat), 
            String.format("%.6f", currentLng),
            String.format("%.4f", distance));
        
          return sendTrackingEvent(order.getId(), currentLat, currentLng, targetLat, targetLng);
    }


     private Mono<String> sendTrackingEvent(Long orderId, double lat, double lng, double deliveryLat, double deliveryLng){
        OrderStatusEvent event = new OrderStatusEvent(
        orderId, 
            "EN_CAMINO", 
            "driver-001", 
            LocalDateTime.now(), 
            lat, 
            lng, 
            deliveryLat, 
            deliveryLng
        );
         kafkaProducerService.sendStatusUpdate(event);
        log.info("📡 Evento de tracking enviado para orderId: {} - Posición: ({}, {})", 
            orderId, String.format("%.6f", lat), String.format("%.6f", lng));
            
        return Mono.just("Evento enviado");
    }

    
 private Mono<String> markAsDelivered(Long orderId, double finalLat, double finalLng){
    log.info("Marcando pedido {} como ENTREGADO", orderId);
    
    //  Solo envía evento Kafka - el consumer se encargará de guardar en PostgreSQL
    OrderStatusEvent event = new OrderStatusEvent(
        orderId, 
        "ENTREGADO",
        "driver-001",
        LocalDateTime.now(), 
        finalLat,
        finalLng, 
        finalLat,
        finalLng
    );
    
    kafkaProducerService.sendStatusUpdate(event);
    log.info("📡 EVENTO DE ENTREGA enviado para pedido {}", orderId);

    // Resetear para próximo pedido
    currentOrderId = null;
    currentLat = 19.4326;
    currentLng = -99.1332;
    
    return Mono.just("Entregado");
   }




    



    private double haversine(double lat1, double lon1, double lat2, double lon2) {
        double R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon/2) * Math.sin(dLon/2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }


   }




