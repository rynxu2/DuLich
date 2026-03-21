package com.dulich.itinerary.controller;

import com.dulich.itinerary.entity.Itinerary;
import com.dulich.itinerary.service.ItineraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Itinerary Controller — REST API for travel schedules
 * 
 * GET  /itinerary/{bookingId} — Get all activities for a booking
 * POST /itinerary             — Create itinerary entry
 * POST /itinerary/bulk        — Create multiple entries at once
 * PUT  /itinerary/{id}        — Update an itinerary entry
 */
@RestController
@RequestMapping("/itinerary")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @GetMapping("/{bookingId}")
    public ResponseEntity<List<Itinerary>> getItinerary(@PathVariable Long bookingId) {
        return ResponseEntity.ok(itineraryService.getItineraryByBookingId(bookingId));
    }

    @PostMapping
    public ResponseEntity<Itinerary> createItinerary(@RequestBody Itinerary itinerary) {
        return ResponseEntity.ok(itineraryService.createItinerary(itinerary));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Itinerary>> createBulkItinerary(
            @RequestBody List<Itinerary> itineraries) {
        return ResponseEntity.ok(itineraryService.createBulkItinerary(itineraries));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Itinerary> updateItinerary(
            @PathVariable Long id, @RequestBody Itinerary itinerary) {
        return ResponseEntity.ok(itineraryService.updateItinerary(id, itinerary));
    }
}
