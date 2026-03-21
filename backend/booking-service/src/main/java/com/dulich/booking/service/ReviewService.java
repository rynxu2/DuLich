package com.dulich.booking.service;

import com.dulich.booking.dto.CreateReviewRequest;
import com.dulich.booking.entity.Review;
import com.dulich.booking.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public List<Review> getReviewsByTour(Long tourId) {
        return reviewRepository.findByTourIdOrderByCreatedAtDesc(tourId);
    }

    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Review createReview(Long userId, CreateReviewRequest request) {
        if (reviewRepository.existsByUserIdAndTourId(userId, request.getTourId())) {
            throw new RuntimeException("You have already reviewed this tour");
        }

        Review review = Review.builder()
            .userId(userId)
            .tourId(request.getTourId())
            .bookingId(request.getBookingId())
            .rating(request.getRating())
            .title(request.getTitle())
            .comment(request.getComment())
            .build();

        return reviewRepository.save(review);
    }

    public void deleteReview(Long id, Long userId) {
        Review review = reviewRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Review not found"));
        if (!review.getUserId().equals(userId)) {
            throw new RuntimeException("Not authorized to delete this review");
        }
        reviewRepository.delete(review);
    }
}
