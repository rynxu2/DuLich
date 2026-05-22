package com.dulich.booking.repository;

import com.dulich.booking.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Booking> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countByUserId(Long userId);
    List<Booking> findByStatus(String status);
    boolean existsByUserIdAndTourIdAndStatus(Long userId, Long tourId, String status);
    long countByUserIdAndTourIdAndStatus(Long userId, Long tourId, String status);
}
