package com.dulich.booking.service;

import com.dulich.booking.entity.Payment;
import com.dulich.booking.entity.Transaction;
import com.dulich.booking.repository.PaymentRepository;
import com.dulich.booking.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Record a cash payment for a booking.
     * Cash payments are marked PENDING until confirmed by admin/staff.
     */
    @Transactional
    public Payment processPayment(Long bookingId, Long userId, BigDecimal amount) {
        Payment payment = Payment.builder()
            .bookingId(bookingId)
            .userId(userId)
            .amount(amount)
            .paymentMethod("CASH")
            .status("PENDING")
            .build();
        payment = paymentRepository.save(payment);

        log.info("Cash payment recorded for booking {}: paymentId={}", bookingId, payment.getId());
        return payment;
    }

    /**
     * Confirm a cash payment (called by admin/staff when cash is received).
     */
    @Transactional
    public Payment confirmCashPayment(Long paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        if (!"PENDING".equals(payment.getStatus())) {
            throw new IllegalStateException("Payment already processed with status: " + payment.getStatus());
        }

        payment.setStatus("SUCCESS");
        payment.setPaidAt(LocalDateTime.now());
        payment.setUpdatedAt(LocalDateTime.now());

        Transaction tx = Transaction.builder()
            .paymentId(payment.getId())
            .type("CHARGE")
            .amount(payment.getAmount())
            .status("SUCCESS")
            .providerData("CASH_CONFIRMED")
            .build();
        transactionRepository.save(tx);
        paymentRepository.save(payment);

        log.info("Cash payment {} confirmed for booking {}", paymentId, payment.getBookingId());
        return payment;
    }

    public Payment getById(Long id) {
        return paymentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
    }

    public List<Payment> getByBooking(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    public List<Payment> getByUser(Long userId) {
        return paymentRepository.findByUserId(userId);
    }
}
