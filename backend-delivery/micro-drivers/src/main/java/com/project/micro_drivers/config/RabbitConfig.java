package com.project.micro_drivers.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@org.springframework.scheduling.annotation.EnableScheduling
public class RabbitConfig {

    public static final String SAGA_EXCHANGE = "exchange.saga";

    public static final String QUEUE_PAYMENT_OK = "queue.payment.ok";

    @Bean
    public TopicExchange sagaExchange() {
        return new TopicExchange(SAGA_EXCHANGE);
    }

    @Bean
    public Queue paymentOkQueue() {
        return QueueBuilder.durable(QUEUE_PAYMENT_OK).build();
    }

    @Bean
    public Binding bindingPaymentOk(Queue paymentOkQueue, TopicExchange sagaExchange) {
        return BindingBuilder.bind(paymentOkQueue).to(sagaExchange).with("payment.ok");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
