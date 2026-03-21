package com.dulich.booking;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;

/**
 * Booking Service — Transaction management with fault tolerance
 * 
 * Handles tour bookings, cancellations, and booking history.
 * Uses OpenFeign to call Tour Service for price validation.
 * Implements Circuit Breaker pattern via Resilience4j for
 * graceful degradation when Tour Service is unavailable.
 */
@SpringBootApplication
@EnableDiscoveryClient
@EnableFeignClients
public class BookingServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(BookingServiceApplication.class, args);
    }
}
