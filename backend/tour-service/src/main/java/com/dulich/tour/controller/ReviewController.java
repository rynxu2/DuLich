package com.dulich.tour.controller;

import com.dulich.tour.entity.Review;
import com.dulich.tour.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @PostMapping
    public ResponseEntity<Review> create(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Review review) {
        review.setUserId(Long.parseLong(userId));
        return ResponseEntity.ok(reviewService.createReview(review));
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<Review>> getByTour(@PathVariable Long tourId) {
        return ResponseEntity.ok(reviewService.getReviewsByTour(tourId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Review>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(userId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Review>> getMyReviews(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(Long.parseLong(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
