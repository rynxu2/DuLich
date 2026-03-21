package com.dulich.payment.service;

import com.dulich.payment.config.RabbitMQConfig;
import com.dulich.payment.entity.Payment;
import com.dulich.payment.entity.Transaction;
import com.dulich.payment.event.*;
import com.dulich.payment.repository.PaymentRepository;
import com.dulich.payment.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Payment Service — Saga Pattern Consumer
 *
 * Flow:
 * 1. Listen for booking.created event
 * 2. Process payment via relevant provider (VNPay/Momo/ZaloPay)
 * 3. Publish payment.success or payment.failed
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final TransactionRepository transactionRepository;
    private final RabbitTemplate rabbitTemplate;

    /**
     * SAGA STEP 2: Listen for booking.created → process payment.
     */
    @RabbitListener(queues = RabbitMQConfig.PAYMENT_BOOKING_QUEUE)
    @Transactional
    public void handleBookingCreated(BookingCreatedEvent event) {
        log.info("Received booking.created event: bookingId={}, amount={}, method={}",
                event.getBookingId(), event.getTotalPrice(), event.getPaymentMethod());

        // Create payment record
        Payment payment = Payment.builder()
                .bookingId(event.getBookingId())
                .userId(event.getUserId())
                .amount(event.getTotalPrice())
                .paymentMethod(event.getPaymentMethod())
                .status("PROCESSING")
                .build();
        payment = paymentRepository.save(payment);

        try {
            // Process payment based on method
            String transactionId = processPayment(payment, event);

            // Mark as success
            payment.setStatus("SUCCESS");
            payment.setProviderTransactionId(transactionId);
            payment.setPaidAt(LocalDateTime.now());
            payment.setUpdatedAt(LocalDateTime.now());
            paymentRepository.save(payment);

            // Log transaction
            Transaction tx = Transaction.builder()
                    .paymentId(payment.getId())
                    .type("CHARGE")
                    .amount(payment.getAmount())
                    .status("SUCCESS")
                    .providerData(transactionId)
                    .build();
            transactionRepository.save(tx);

            // Publish payment.success → Booking Service will confirm
            publishSuccess(payment);
            log.info("Payment SUCCESS: paymentId={}, bookingId={}", payment.getId(), event.getBookingId());

        } catch (Exception e) {
            // Mark as failed
            payment.setStatus("FAILED");
            payment.setUpdatedAt(LocalDateTime.now());
            payment.setProviderResponse(e.getMessage());
            paymentRepository.save(payment);

            // Publish payment.failed → Booking Service will cancel
            publishFailed(event, e.getMessage());
            log.error("Payment FAILED: bookingId={}, reason={}", event.getBookingId(), e.getMessage());
        }
    }

    /**
     * Route payment to correct provider.
     * Returns provider transaction ID.
     */
    private String processPayment(Payment payment, BookingCreatedEvent event) {
        return switch (payment.getPaymentMethod().toUpperCase()) {
            case "VNPAY" -> processVNPay(payment);
            case "MOMO" -> processMomo(payment);
            case "ZALOPAY" -> processZaloPay(payment);
            case "CASH" -> processCash(payment);
            default -> throw new RuntimeException("Unknown payment method: " + payment.getPaymentMethod());
        };
    }

    // ════════════════════════════════
    // Payment Provider Implementations
    // ════════════════════════════════

    private String processVNPay(Payment payment) {
        // TODO: Integrate with VNPay API
        // 1. Build VNPay payment URL with params
        // 2. For sandbox: simulate success
        log.info("Processing VNPay payment: {} VND", payment.getAmount());
        simulatePaymentDelay();
        return "VNPAY-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String processMomo(Payment payment) {
        // TODO: Integrate with Momo API
        // 1. Create Momo payment request
        // 2. For sandbox: simulate success
        log.info("Processing Momo payment: {} VND", payment.getAmount());
        simulatePaymentDelay();
        return "MOMO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String processZaloPay(Payment payment) {
        // TODO: Integrate with ZaloPay API
        log.info("Processing ZaloPay payment: {} VND", payment.getAmount());
        simulatePaymentDelay();
        return "ZALO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String processCash(Payment payment) {
        // Cash payments are auto-confirmed
        log.info("Cash payment recorded: {} VND", payment.getAmount());
        return "CASH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void simulatePaymentDelay() {
        try { Thread.sleep(500); } catch (InterruptedException ignored) {}
    }

    // ════════════════════════════════
    // Event Publishers
    // ════════════════════════════════

    private void publishSuccess(Payment payment) {
        PaymentSuccessEvent event = PaymentSuccessEvent.builder()
                .paymentId(payment.getId())
                .bookingId(payment.getBookingId())
                .userId(payment.getUserId())
                .amount(payment.getAmount())
                .paymentMethod(payment.getPaymentMethod())
                .providerTransactionId(payment.getProviderTransactionId())
                .build();
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PAYMENT_EXCHANGE,
                RabbitMQConfig.PAYMENT_SUCCESS_KEY,
                event
        );
    }

    private void publishFailed(BookingCreatedEvent original, String reason) {
        PaymentFailedEvent event = PaymentFailedEvent.builder()
                .bookingId(original.getBookingId())
                .userId(original.getUserId())
                .reason(reason)
                .build();
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.PAYMENT_EXCHANGE,
                RabbitMQConfig.PAYMENT_FAILED_KEY,
                event
        );
    }

    // ════════════════════════════════
    // REST API Methods
    // ════════════════════════════════

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found: " + id));
    }

    public List<Payment> getPaymentsByBooking(Long bookingId) {
        return paymentRepository.findByBookingId(bookingId);
    }

    public List<Payment> getPaymentsByUser(Long userId) {
        return paymentRepository.findByUserId(userId);
    }
}
