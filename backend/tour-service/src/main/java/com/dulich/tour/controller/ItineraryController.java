package com.dulich.tour.controller;

import com.dulich.tour.entity.Itinerary;
import com.dulich.tour.service.ItineraryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/itinerary")
@RequiredArgsConstructor
public class ItineraryController {

    private final ItineraryService itineraryService;

    @GetMapping("/{bookingId}")
    public ResponseEntity<List<Itinerary>> get(@PathVariable Long bookingId) {
        return ResponseEntity.ok(itineraryService.getByBookingId(bookingId));
    }

    @PostMapping
    public ResponseEntity<Itinerary> create(@RequestBody Itinerary itinerary) {
        return ResponseEntity.ok(itineraryService.create(itinerary));
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<Itinerary>> createBulk(@RequestBody List<Itinerary> items) {
        return ResponseEntity.ok(itineraryService.createBulk(items));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Itinerary> update(@PathVariable Long id, @RequestBody Itinerary item) {
        return ResponseEntity.ok(itineraryService.update(id, item));
    }
}
