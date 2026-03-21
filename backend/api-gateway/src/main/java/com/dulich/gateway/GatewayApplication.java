package com.dulich.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * API Gateway — Central entry point (API Gateway Pattern)
 * 
 * All client requests flow through this gateway, which:
 * 1. Routes requests to appropriate microservices via Eureka
 * 2. Validates JWT tokens on protected endpoints
 * 3. Provides a single entry point for the mobile app
 * 4. Enables cross-cutting concerns (logging, rate limiting)
 */
@SpringBootApplication
@EnableDiscoveryClient
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
