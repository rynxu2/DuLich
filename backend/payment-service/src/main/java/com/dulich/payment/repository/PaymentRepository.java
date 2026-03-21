package com.dulich.payment.repository;

import com.dulich.payment.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByBookingId(Long bookingId);
    List<Payment> findByUserId(Long userId);
    Optional<Payment> findByBookingIdAndStatus(Long bookingId, String status);
}
