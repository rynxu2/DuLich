package com.dulich.expense.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXPENSE_EXCHANGE = "expense.exchange";
    public static final String EXPENSE_CREATED_QUEUE = "expense.created.queue";
    public static final String EXPENSE_APPROVED_QUEUE = "expense.approved.queue";

    @Bean
    public TopicExchange expenseExchange() {
        return new TopicExchange(EXPENSE_EXCHANGE);
    }

    @Bean
    public Queue expenseCreatedQueue() {
        return QueueBuilder.durable(EXPENSE_CREATED_QUEUE).build();
    }

    @Bean
    public Queue expenseApprovedQueue() {
        return QueueBuilder.durable(EXPENSE_APPROVED_QUEUE).build();
    }

    @Bean
    public Binding createdBinding(Queue expenseCreatedQueue, TopicExchange expenseExchange) {
        return BindingBuilder.bind(expenseCreatedQueue).to(expenseExchange).with("expense.created");
    }

    @Bean
    public Binding approvedBinding(Queue expenseApprovedQueue, TopicExchange expenseExchange) {
        return BindingBuilder.bind(expenseApprovedQueue).to(expenseExchange).with("expense.approved");
    }

    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
