package com.dulich.booking.controller;

import com.dulich.booking.dto.BookingRequest;
import com.dulich.booking.dto.BookingResponse;
import com.dulich.booking.dto.ProfileStatsResponse;
import com.dulich.booking.entity.Booking;
import com.dulich.booking.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Booking Controller — REST API for bookings
 *
 * POST /bookings              — Create booking (userId from gateway header)
 * GET  /bookings              — List all (supports ?page=0&size=20 for pagination)
 * GET  /bookings/user/{userId} — User's booking history (supports pagination)
 * GET  /bookings/{id}          — Booking details (enriched with tour info)
 * PUT  /bookings/{id}/cancel   — Cancel a booking
 */
@RestController
@RequestMapping("/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @GetMapping
    public ResponseEntity<?> listAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<BookingResponse> result = bookingService.getAllBookingResponses(
                PageRequest.of(page, Math.min(size, 100)));
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.ok(bookingService.getAllBookingResponses());
    }

    @PostMapping
    public ResponseEntity<BookingResponse> createBooking(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(
            bookingService.createBooking(Long.parseLong(userId), request));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserBookings(
            @PathVariable Long userId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        if (page != null && size != null) {
            Page<BookingResponse> result = bookingService.getBookingResponsesByUserId(
                userId, PageRequest.of(page, Math.min(size, 50)));
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.ok(bookingService.getBookingResponsesByUserId(userId));
    }

    @GetMapping("/user/{userId}/stats")
    public ResponseEntity<ProfileStatsResponse> getUserProfileStats(@PathVariable Long userId) {
        return ResponseEntity.ok(bookingService.getProfileStatsByUserId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingResponseById(id));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<Booking> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<Booking> confirmBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.confirmBooking(id));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Booking> rejectBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.rejectBooking(id));
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<Booking> completeBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.completeBooking(id));
    }

    // ── Analytics Endpoints ──

    @GetMapping("/analytics/profit-by-tour")
    public ResponseEntity<List<java.util.Map<String, Object>>> profitByTour() {
        return ResponseEntity.ok(bookingService.getProfitByTour());
    }

    @GetMapping("/analytics/summary")
    public ResponseEntity<java.util.Map<String, Object>> analyticsSummary() {
        return ResponseEntity.ok(bookingService.getAnalyticsSummary());
    }
}
