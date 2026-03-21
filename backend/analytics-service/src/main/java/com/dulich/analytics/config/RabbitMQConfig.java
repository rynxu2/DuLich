package com.dulich.analytics.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Subscribe to payment events
    public static final String PAYMENT_SUCCESS_QUEUE = "analytics.payment.success.queue";
    public static final String PAYMENT_EXCHANGE = "payment.exchange";

    // Subscribe to expense events
    public static final String EXPENSE_APPROVED_QUEUE = "analytics.expense.approved.queue";
    public static final String EXPENSE_EXCHANGE = "expense.exchange";

    @Bean
    public Queue paymentSuccessQueue() {
        return QueueBuilder.durable(PAYMENT_SUCCESS_QUEUE).build();
    }

    @Bean
    public Queue expenseApprovedQueue() {
        return QueueBuilder.durable(EXPENSE_APPROVED_QUEUE).build();
    }

    @Bean
    public TopicExchange paymentExchange() {
        return new TopicExchange(PAYMENT_EXCHANGE);
    }

    @Bean
    public TopicExchange expenseExchange() {
        return new TopicExchange(EXPENSE_EXCHANGE);
    }

    @Bean
    public Binding paymentBinding(Queue paymentSuccessQueue, TopicExchange paymentExchange) {
        return BindingBuilder.bind(paymentSuccessQueue).to(paymentExchange).with("payment.success");
    }

    @Bean
    public Binding expenseBinding(Queue expenseApprovedQueue, TopicExchange expenseExchange) {
        return BindingBuilder.bind(expenseApprovedQueue).to(expenseExchange).with("expense.approved");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
