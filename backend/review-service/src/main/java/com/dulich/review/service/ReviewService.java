package com.dulich.review.service;

import com.dulich.review.config.RabbitMQConfig;
import com.dulich.review.entity.Review;
import com.dulich.review.event.ReviewSubmittedEvent;
import com.dulich.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final RabbitTemplate rabbitTemplate;

    public Review createReview(Review review) {
        Review saved = reviewRepository.save(review);

        // Publish event → Tour Service will update tour rating
        try {
            ReviewSubmittedEvent event = ReviewSubmittedEvent.builder()
                    .reviewId(saved.getId())
                    .tourId(saved.getTourId())
                    .userId(saved.getUserId())
                    .rating(saved.getRating())
                    .build();
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.REVIEW_EXCHANGE,
                    RabbitMQConfig.REVIEW_SUBMITTED_KEY,
                    event
            );
            log.info("Published review.submitted for tourId={}", saved.getTourId());
        } catch (Exception e) {
            log.warn("Failed to publish review event: {}", e.getMessage());
        }

        return saved;
    }

    public List<Review> getReviewsByTour(Long tourId) {
        return reviewRepository.findByTourIdOrderByCreatedAtDesc(tourId);
    }

    public List<Review> getReviewsByUser(Long userId) {
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }
}
