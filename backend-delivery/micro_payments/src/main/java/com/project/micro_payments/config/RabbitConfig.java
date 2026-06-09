package com.project.micro_payments.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@org.springframework.scheduling.annotation.EnableScheduling
public class RabbitConfig {

    public static final String SAGA_EXCHANGE = "exchange.saga";

    public static final String QUEUE_STOCK_RESERVED = "queue.stock.reserved";
    public static final String QUEUE_DRIVER_UNAVAILABLE = "queue.driver.unavailable";

    @Bean
    public TopicExchange sagaExchange() {
        return new TopicExchange(SAGA_EXCHANGE);
    }

    @Bean
    public Queue stockReservedQueue() {
        return QueueBuilder.durable(QUEUE_STOCK_RESERVED).build();
    }

    @Bean
    public Queue driverUnavailableQueue() {
        return QueueBuilder.durable(QUEUE_DRIVER_UNAVAILABLE).build();
    }

    @Bean
    public Binding bindingStockReserved(Queue stockReservedQueue, TopicExchange sagaExchange) {
        return BindingBuilder.bind(stockReservedQueue).to(sagaExchange).with("stock.reserved");
    }

    @Bean
    public Binding bindingDriverUnavailable(Queue driverUnavailableQueue, TopicExchange sagaExchange) {
        return BindingBuilder.bind(driverUnavailableQueue).to(sagaExchange).with("driver.unavailable");
    }

    @Bean
    public Jackson2JsonMessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
