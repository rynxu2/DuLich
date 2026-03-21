package com.dulich.tour.controller;

import com.dulich.tour.entity.Tour;
import com.dulich.tour.service.TourService;
import com.dulich.tour.service.CapacityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Tour Controller — REST API for tour management + capacity management
 * 
 * GET    /tours          — List all tours (or search with ?keyword=)
 * GET    /tours/{id}     — Get tour details
 * POST   /tours          — Create new tour (admin)
 * PUT    /tours/{id}     — Update tour (admin)
 * DELETE /tours/{id}     — Delete tour (admin)
 * GET    /tours/departures/{depId}/availability — Check seat availability
 * POST   /tours/departures/{depId}/reserve      — Reserve seats
 * POST   /tours/departures/{depId}/confirm      — Confirm seats
 * POST   /tours/departures/{depId}/release      — Release seats
 */
@RestController
@RequestMapping("/tours")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;
    private final CapacityService capacityService;

    @GetMapping
    public ResponseEntity<List<Tour>> getAllTours(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String keyword) {
        if ((keyword != null && !keyword.isEmpty()) || (category != null && !category.isEmpty())) {
            return ResponseEntity.ok(tourService.listTours(keyword, category));
        }
        return ResponseEntity.ok(tourService.getAllTours());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Tour> getTourById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(tourService.getTourById(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<Tour> createTour(@RequestBody Tour tour) {
        return ResponseEntity.ok(tourService.createTour(tour));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tour> updateTour(@PathVariable Long id, @RequestBody Tour tour) {
        return ResponseEntity.ok(tourService.updateTour(id, tour));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTour(@PathVariable Long id) {
        tourService.deleteTour(id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════
    //  CAPACITY MANAGEMENT
    // ═══════════════════════════════════════

    @GetMapping("/departures/{depId}/availability")
    public ResponseEntity<Map<String, Object>> getAvailability(@PathVariable Long depId) {
        return ResponseEntity.ok(capacityService.getAvailability(depId));
    }

    @PostMapping("/departures/{depId}/reserve")
    public ResponseEntity<Map<String, Object>> reserveSeats(
            @PathVariable Long depId,
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "1") int seats) {
        boolean ok = capacityService.reserveSeats(depId, bookingId, seats);
        return ResponseEntity.ok(Map.of("success", ok, "departureId", depId, "seats", seats));
    }

    @PostMapping("/departures/{depId}/confirm")
    public ResponseEntity<Map<String, Object>> confirmSeats(
            @PathVariable Long depId,
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "1") int seats) {
        boolean ok = capacityService.confirmSeats(depId, bookingId, seats);
        return ResponseEntity.ok(Map.of("success", ok, "departureId", depId, "seats", seats));
    }

    @PostMapping("/departures/{depId}/release")
    public ResponseEntity<Map<String, Object>> releaseSeats(
            @PathVariable Long depId,
            @RequestParam Long bookingId,
            @RequestParam(defaultValue = "1") int seats) {
        capacityService.releaseSeats(depId, bookingId, seats);
        return ResponseEntity.ok(Map.of("released", true, "departureId", depId, "seats", seats));
    }
}
