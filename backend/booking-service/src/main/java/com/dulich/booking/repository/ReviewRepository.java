package com.dulich.booking.repository;

import com.dulich.booking.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByTourIdOrderByCreatedAtDesc(Long tourId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByUserIdAndTourId(Long userId, Long tourId);
}
