package com.dulich.review.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Publishes review.submitted event → Tour Service updates rating.
 */
@Configuration
public class RabbitMQConfig {
    public static final String REVIEW_EXCHANGE = "review.exchange";
    public static final String REVIEW_SUBMITTED_KEY = "review.submitted";

    @Bean
    public TopicExchange reviewExchange() { return new TopicExchange(REVIEW_EXCHANGE); }

    @Bean
    public MessageConverter jsonMessageConverter() { return new Jackson2JsonMessageConverter(); }
}
