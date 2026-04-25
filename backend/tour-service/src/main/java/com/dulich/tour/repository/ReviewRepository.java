package com.dulich.tour.repository;

import com.dulich.tour.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTourIdOrderByCreatedAtDesc(Long tourId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserId(Long userId);
}
