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
     * Record a SePay payment for a booking.
     * Payment starts in PROCESSING state — updated to SUCCESS/FAILED via webhook.
     */
    @Transactional
    public Payment processSepayPayment(Long bookingId, Long userId, BigDecimal amount,
                                        String checkoutUrl, Long orderCode) {
        Payment payment = Payment.builder()
            .bookingId(bookingId)
            .userId(userId)
            .amount(amount)
            .paymentMethod("SEPAY")
            .status("PROCESSING")
            .providerTransactionId(String.valueOf(orderCode))
            .providerResponse(checkoutUrl)
            .build();
        payment = paymentRepository.save(payment);

        log.info("SePay payment recorded for booking {}: paymentId={}, orderCode={}",
                bookingId, payment.getId(), orderCode);
        return payment;
    }

    /**
     * Record a VTC Pay card payment for a booking.
     * Payment starts in PROCESSING state — updated via IPN or return URL callback.
     */
    @Transactional
    public Payment processVtcpayPayment(Long bookingId, Long userId, BigDecimal amount,
                                         String checkoutUrl, String referenceNumber) {
        Payment payment = Payment.builder()
            .bookingId(bookingId)
            .userId(userId)
            .amount(amount)
            .paymentMethod("VTCPAY")
            .status("PROCESSING")
            .providerTransactionId(referenceNumber)
            .providerResponse(checkoutUrl)
            .build();
        payment = paymentRepository.save(payment);

        log.info("VTC Pay payment recorded for booking {}: paymentId={}, refNumber={}",
                bookingId, payment.getId(), referenceNumber);
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

    /**
     * Update payment status — used by webhook handler.
     */
    @Transactional
    public Payment updatePaymentStatus(Long paymentId, String status, String providerData) {
        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new RuntimeException("Payment not found: " + paymentId));

        payment.setStatus(status);
        payment.setProviderResponse(providerData);
        payment.setUpdatedAt(LocalDateTime.now());

        if ("SUCCESS".equals(status)) {
            payment.setPaidAt(LocalDateTime.now());

            Transaction tx = Transaction.builder()
                .paymentId(payment.getId())
                .type("CHARGE")
                .amount(payment.getAmount())
                .status("SUCCESS")
                .providerData("SEPAY_WEBHOOK")
                .build();
            transactionRepository.save(tx);
        }

        paymentRepository.save(payment);
        log.info("Payment {} status updated to {}", paymentId, status);
        return payment;
    }

    /**
     * Find payment by provider transaction ID (SePay orderCode).
     */
    public Payment findByProviderTransactionId(String txnId) {
        return paymentRepository.findByProviderTransactionId(txnId).orElse(null);
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
