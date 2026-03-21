package com.dulich.booking.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ config for Booking Service (Saga Orchestrator).
 *
 * PUBLISHES: booking.exchange → booking.created / booking.confirmed
 * SUBSCRIBES: payment.exchange → payment.success / payment.failed
 */
@Configuration
public class RabbitMQConfig {

    // ── Booking events (publish) ──
    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String BOOKING_CREATED_KEY = "booking.created";
    public static final String BOOKING_CONFIRMED_KEY = "booking.confirmed";

    // ── Payment events (subscribe) ──
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
    public static final String BOOKING_PAYMENT_QUEUE = "booking.payment.queue";
    public static final String BOOKING_PAYMENT_FAILED_QUEUE = "booking.payment.failed.queue";
    public static final String PAYMENT_SUCCESS_KEY = "payment.success";
    public static final String PAYMENT_FAILED_KEY = "payment.failed";

    @Bean
    public TopicExchange bookingExchange() {
        return new TopicExchange(BOOKING_EXCHANGE);
    }

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(PAYMENT_EXCHANGE);
    }

    // Queues for payment responses
    @Bean
    public Queue bookingPaymentQueue() {
        return QueueBuilder.durable(BOOKING_PAYMENT_QUEUE).build();
    }

    @Bean
    public Queue bookingPaymentFailedQueue() {
        return QueueBuilder.durable(BOOKING_PAYMENT_FAILED_QUEUE).build();
    }

    // Bindings
    @Bean
    public Binding paymentSuccessBinding() {
        return BindingBuilder.bind(bookingPaymentQueue()).to(paymentExchange()).with(PAYMENT_SUCCESS_KEY);
    }

    @Bean
    public Binding paymentFailedBinding() {
        return BindingBuilder.bind(bookingPaymentFailedQueue()).to(paymentExchange()).with(PAYMENT_FAILED_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
