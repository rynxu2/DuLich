package com.dulich.review.repository;

import com.dulich.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTourIdOrderByCreatedAtDesc(Long tourId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
}
