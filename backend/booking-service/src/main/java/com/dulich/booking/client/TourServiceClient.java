package com.dulich.booking.client;

import com.dulich.booking.dto.TourResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Feign Client — Inter-service communication with Tour Service
 * 
 * Uses Eureka service discovery (name = "tour-service") to resolve
 * the URL dynamically. No hard-coded URLs needed.
 */
@FeignClient(name = "tour-service")
public interface TourServiceClient {

    @GetMapping("/tours/{id}")
    TourResponse getTourById(@PathVariable("id") Long id);
}
