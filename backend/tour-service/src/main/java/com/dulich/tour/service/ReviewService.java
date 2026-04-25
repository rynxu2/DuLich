package com.dulich.tour.service;

import com.dulich.tour.entity.Review;
import com.dulich.tour.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;

    public Review createReview(Review review) {
        Review saved = reviewRepository.save(review);
        log.info("Review created for tourId={} by userId={}", saved.getTourId(), saved.getUserId());
        return saved;
    }

    public List<Review> getReviewsByTour(Long tourId) {
        return reviewRepository.findByTourIdOrderByCreatedAtDesc(tourId);
    }

    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getReviewCountByUser(Long userId) {
        return reviewRepository.countByUserId(userId);
    }

    public void deleteReview(Long id) {
        reviewRepository.deleteById(id);
    }
}
