package com.dulich.tour;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Tour Service — Manage travel tours
 * 
 * Provides CRUD operations for tours with JSONB-based
 * itinerary storage in PostgreSQL. Supports search and filtering.
 */
@SpringBootApplication
@EnableDiscoveryClient
public class TourServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(TourServiceApplication.class, args);
    }
}
