package com.project.micro_realtime.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@org.springframework.scheduling.annotation.EnableScheduling
public class RabbitConfig {

    public static final String SAGA_EXCHANGE = "exchange.saga";

    public static final String QUEUE_STOCK_FAILED = "queue.stock.failed";
    public static final String QUEUE_PAYMENT_FAILED = "queue.payment.failed";
    public static final String QUEUE_DRIVER_ASSIGNED = "queue.driver.assigned";
    public static final String QUEUE_DRIVER_UNAVAILABLE = "queue.driver.unavailable";

    @Bean
    public TopicExchange sagaExchange() {
        return new TopicExchange(SAGA_EXCHANGE);
    }

    @Bean
    public Queue stockFailedQueue() {
        return QueueBuilder.durable(QUEUE_STOCK_FAILED).build();
    }

    @Bean
    public Queue paymentFailedQueue() {
        return QueueBuilder.durable(QUEUE_PAYMENT_FAILED).build();
    }

    @Bean
    public Queue driverAssignedQueue() {
        return QueueBuilder.durable(QUEUE_DRIVER_ASSIGNED).build();
    }

    @Bean
    public Queue driverUnavailableQueue() {
        return QueueBuilder.durable(QUEUE_DRIVER_UNAVAILABLE).build();
    }

    @Bean
    public Binding bindingStockFailed(Queue stockFailedQueue, TopicExchange sagaExchange) {
        return BindingBuilder.bind(stockFailedQueue).to(sagaExchange).with("stock.failed");
    }

    @Bean
    public Binding bindingPaymentFailed(Queue paymentFailedQueue, TopicExchange sagaExchange) {
        return BindingBuilder.bind(paymentFailedQueue).to(sagaExchange).with("payment.failed");
    }

    @Bean
    public Binding bindingDriverAssigned(Queue driverAssignedQueue, TopicExchange sagaExchange) {
        return BindingBuilder.bind(driverAssignedQueue).to(sagaExchange).with("driver.assigned");
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
