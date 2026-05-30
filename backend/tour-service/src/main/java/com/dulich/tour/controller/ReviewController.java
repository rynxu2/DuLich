package com.dulich.tour.controller;

import com.dulich.tour.client.BookingVerifyClient;
import com.dulich.tour.entity.Review;
import com.dulich.tour.service.ReviewService;
import com.dulich.tour.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;
    private final ReviewRepository reviewRepository;
    private final BookingVerifyClient bookingVerifyClient;

    /**
     * Check if user can review a tour.
     * Logic: completedBookings > existingReviews
     */
    @GetMapping("/can-review")
    public ResponseEntity<Map<String, Object>> canReview(
            @RequestHeader("X-User-Id") String userId,
            @RequestParam Long tourId) {
        Long uid = Long.parseLong(userId);
        try {
            Map<String, Object> result = bookingVerifyClient.checkCompleted(uid, tourId);
            long completedCount = result.get("completedCount") != null
                ? ((Number) result.get("completedCount")).longValue() : 0;
            long reviewCount = reviewRepository.countByUserIdAndTourId(uid, tourId);
            boolean canReview = completedCount > reviewCount;
            return ResponseEntity.ok(Map.of(
                "canReview", canReview,
                "completedCount", completedCount,
                "reviewCount", reviewCount
            ));
        } catch (Exception e) {
            log.warn("Could not check review eligibility: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("canReview", false, "completedCount", 0L, "reviewCount", 0L));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(
            @RequestHeader("X-User-Id") String userId,
            @RequestBody Review review) {
        Long uid = Long.parseLong(userId);
        review.setUserId(uid);

        // Verify: completedBookings > existingReviews
        try {
            Map<String, Object> result = bookingVerifyClient.checkCompleted(uid, review.getTourId());
            long completedCount = result.get("completedCount") != null
                ? ((Number) result.get("completedCount")).longValue() : 0;
            long reviewCount = reviewRepository.countByUserIdAndTourId(uid, review.getTourId());
            if (completedCount <= reviewCount) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Bạn đã đánh giá cho tất cả chuyến đi hoàn thành. Hãy hoàn thành thêm chuyến đi để đánh giá tiếp."));
            }
        } catch (Exception e) {
            log.warn("Could not verify review eligibility: {}", e.getMessage());
            return ResponseEntity.status(503).build();
        }

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

    @GetMapping("/user/{userId}/count")
    public ResponseEntity<Long> getUserReviewCount(@PathVariable Long userId) {
        return ResponseEntity.ok(reviewService.getReviewCountByUser(userId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<Review>> getMyReviews(@RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(reviewService.getReviewsByUser(Long.parseLong(userId)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @RequestHeader("X-User-Id") String userId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found: " + id));
        if (!String.valueOf(review.getUserId()).equals(userId) && !"ADMIN".equals(role)) {
            return ResponseEntity.status(403).build();
        }
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}
