package com.dulich.platform.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Exchanges (must match booking-service)
    public static final String BOOKING_EXCHANGE = "booking.exchange";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";

    // Platform-specific queues
    public static final String NOTIF_BOOKING_CREATED_QUEUE = "platform.notif.booking.created.queue";
    public static final String NOTIF_BOOKING_CONFIRMED_QUEUE = "platform.notif.booking.confirmed.queue";
    public static final String NOTIF_PAYMENT_SUCCESS_QUEUE = "platform.notif.payment.success.queue";
    public static final String NOTIF_PAYMENT_FAILED_QUEUE = "platform.notif.payment.failed.queue";

    // Routing keys (must match booking-service)
    public static final String BOOKING_CREATED_KEY = "booking.created";
    public static final String BOOKING_CONFIRMED_KEY = "booking.confirmed";
    public static final String PAYMENT_SUCCESS_KEY = "payment.success";
    public static final String PAYMENT_FAILED_KEY = "payment.failed";

    @Bean public TopicExchange bookingExchange() { return new TopicExchange(BOOKING_EXCHANGE); }
    @Bean public TopicExchange paymentExchange() { return new TopicExchange(PAYMENT_EXCHANGE); }

    @Bean public Queue notifBookingCreatedQueue() { return QueueBuilder.durable(NOTIF_BOOKING_CREATED_QUEUE).build(); }
    @Bean public Queue notifBookingConfirmedQueue() { return QueueBuilder.durable(NOTIF_BOOKING_CONFIRMED_QUEUE).build(); }
    @Bean public Queue notifPaymentSuccessQueue() { return QueueBuilder.durable(NOTIF_PAYMENT_SUCCESS_QUEUE).build(); }
    @Bean public Queue notifPaymentFailedQueue() { return QueueBuilder.durable(NOTIF_PAYMENT_FAILED_QUEUE).build(); }

    @Bean public Binding bindBookingCreated() { return BindingBuilder.bind(notifBookingCreatedQueue()).to(bookingExchange()).with(BOOKING_CREATED_KEY); }
    @Bean public Binding bindBookingConfirmed() { return BindingBuilder.bind(notifBookingConfirmedQueue()).to(bookingExchange()).with(BOOKING_CONFIRMED_KEY); }
    @Bean public Binding bindPaymentSuccess() { return BindingBuilder.bind(notifPaymentSuccessQueue()).to(paymentExchange()).with(PAYMENT_SUCCESS_KEY); }
    @Bean public Binding bindPaymentFailed() { return BindingBuilder.bind(notifPaymentFailedQueue()).to(paymentExchange()).with(PAYMENT_FAILED_KEY); }

    @Bean public MessageConverter jsonMessageConverter() { return new Jackson2JsonMessageConverter(); }
}
