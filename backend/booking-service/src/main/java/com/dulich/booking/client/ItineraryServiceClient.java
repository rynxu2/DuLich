package com.dulich.booking.client;

import com.dulich.booking.dto.ItineraryRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.List;

/**
 * Feign Client — Inter-service communication with Itinerary Service
 *
 * Used to auto-create itinerary entries when a booking is confirmed.
 */
@FeignClient(name = "tour-service", contextId = "itineraryServiceClient")
public interface ItineraryServiceClient {

    @PostMapping("/itinerary/bulk")
    List<Object> createBulkItinerary(@RequestBody List<ItineraryRequest> itineraries);
}
