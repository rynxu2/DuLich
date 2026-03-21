package com.dulich.booking.controller;

import com.dulich.booking.dto.CreateReviewRequest;
import com.dulich.booking.entity.Review;
import com.dulich.booking.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<Review>> getByTour(@PathVariable Long tourId) {
        return ResponseEntity.ok(reviewService.getReviewsByTour(tourId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Review>> getMyReviews(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @PostMapping
    public ResponseEntity<Review> create(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody CreateReviewRequest request) {
        return ResponseEntity.status(201).body(reviewService.createReview(userId, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long id) {
        reviewService.deleteReview(id, userId);
        return ResponseEntity.noContent().build();
    }
}
