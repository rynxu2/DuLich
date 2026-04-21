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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public Payment processPayment(Long bookingId, Long userId, BigDecimal amount, String paymentMethod) {
        Payment payment = Payment.builder()
            .bookingId(bookingId)
            .userId(userId)
            .amount(amount)
            .paymentMethod(paymentMethod != null ? paymentMethod : "CASH")
            .status("PENDING")
            .build();
        payment = paymentRepository.save(payment);

        try {
            String txId = simulatePayment(payment);
            payment.setStatus("SUCCESS");
            payment.setProviderTransactionId(txId);
            payment.setPaidAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            Transaction tx = Transaction.builder()
                .paymentId(payment.getId())
                .type("CHARGE")
                .amount(payment.getAmount())
                .status("SUCCESS")
                .providerData(txId)
                .build();
            transactionRepository.save(tx);

            log.info("Payment SUCCESS: paymentId={}, bookingId={}", payment.getId(), bookingId);
        } catch (Exception e) {
            payment.setStatus("FAILED");
            payment.setProviderResponse(e.getMessage());
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);
            log.error("Payment FAILED: bookingId={}, reason={}", bookingId, e.getMessage());
        }

        return payment;
    }

    private String simulatePayment(Payment payment) {
        String prefix = switch (payment.getPaymentMethod().toUpperCase()) {
            case "VNPAY" -> "VNPAY";
            case "MOMO" -> "MOMO";
            case "ZALOPAY" -> "ZALO";
            default -> "CASH";
        };
        log.info("Processing {} payment: {} VND", prefix, payment.getAmount());
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
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
