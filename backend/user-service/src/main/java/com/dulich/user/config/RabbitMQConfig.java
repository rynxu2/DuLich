package com.dulich.user.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Subscribes to user.registered event from Auth Service
 * to auto-create user profile.
 */
@Configuration
public class RabbitMQConfig {
    public static final String USER_EXCHANGE = "user.exchange";
    public static final String USER_PROFILE_QUEUE = "user.profile.queue";
    public static final String USER_REGISTERED_KEY = "user.registered";

    @Bean public TopicExchange userExchange() { return new TopicExchange(USER_EXCHANGE); }
    @Bean public Queue userProfileQueue() { return QueueBuilder.durable(USER_PROFILE_QUEUE).build(); }
    @Bean public Binding binding() { return BindingBuilder.bind(userProfileQueue()).to(userExchange()).with(USER_REGISTERED_KEY); }
    @Bean public MessageConverter jsonMessageConverter() { return new Jackson2JsonMessageConverter(); }
}
