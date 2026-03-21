package com.dulich.payment.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ config for Payment Service (Saga Pattern).
 *
 * SUBSCRIBES to: booking.exchange → booking.created
 * PUBLISHES to: payment.exchange → payment.success / payment.failed
 */
@Configuration
public class RabbitMQConfig {

    // ── Booking events (subscribe) ──
    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String PAYMENT_BOOKING_QUEUE = "payment.booking.queue";
    public static final String BOOKING_CREATED_KEY = "booking.created";

    // ── Payment events (publish) ──
    public static final String PAYMENT_EXCHANGE = "payment.exchange";
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

    @Bean
    public Queue paymentBookingQueue() {
        return QueueBuilder.durable(PAYMENT_BOOKING_QUEUE).build();
    }

    @Bean
    public Binding paymentBookingBinding() {
        return BindingBuilder
                .bind(paymentBookingQueue())
                .to(bookingExchange())
                .with(BOOKING_CREATED_KEY);
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
