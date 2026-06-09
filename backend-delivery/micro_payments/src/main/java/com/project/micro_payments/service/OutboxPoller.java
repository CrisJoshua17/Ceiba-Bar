package com.project.micro_payments.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.project.micro_payments.model.OutboxEvent;
import com.project.micro_payments.model.OutboxStatus;
import com.project.micro_payments.repository.OutboxRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class OutboxPoller {

    private final OutboxRepository outboxRepository;
    private final RabbitTemplate rabbitTemplate;

    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pendingEvents = outboxRepository.findByStatusOrderByCreatedAtAsc(OutboxStatus.PENDING);
        if (pendingEvents.isEmpty()) {
            return;
        }

        for (OutboxEvent event : pendingEvents) {
            try {
                String routingKey = event.getEventType().toLowerCase().replace('_', '.');
                Message message = MessageBuilder.withBody(event.getPayload().getBytes(StandardCharsets.UTF_8))
                        .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                        .build();

                rabbitTemplate.send("exchange.saga", routingKey, message);

                event.setStatus(OutboxStatus.SENT);
                event.setSentAt(LocalDateTime.now());
            } catch (Exception e) {
                e.printStackTrace();
                event.setRetryCount(event.getRetryCount() + 1);
                if (event.getRetryCount() >= 5) {
                    event.setStatus(OutboxStatus.FAILED);
                }
            }
            outboxRepository.save(event);
        }
    }
}
