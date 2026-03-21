package com.dulich.itinerary;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * Itinerary Service — Travel schedule management
 * 
 * Manages the actual day-by-day itinerary for booked tours.
 * Each itinerary entry represents a specific activity in
 * the traveler's timeline.
 */
@SpringBootApplication
@EnableDiscoveryClient
public class ItineraryServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(ItineraryServiceApplication.class, args);
    }
}
