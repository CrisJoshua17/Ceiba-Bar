package com.project.micro_realtime.service;

import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

import com.project.micro_realtime.event.OrderStatusEvent;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Service
@RequiredArgsConstructor
@Log4j2
public class KafkaProducerService {

   private final KafkaTemplate<String, OrderStatusEvent> kafkaTemplate;
   private static final String TOPIC = "order-status-updates";

   public void sendStatusUpdate(OrderStatusEvent event) {
      kafkaTemplate.send(TOPIC, event.getOrderId().toString(), event)
            .whenComplete((result, ex) -> {
               if (ex == null) {
                  log.info("Evento enviado correctamente: {}", event);
               } else {
                  log.error("Error enviando evento: {}", event, ex);
               }
            });

   }

}
