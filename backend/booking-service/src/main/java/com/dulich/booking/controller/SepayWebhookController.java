package com.dulich.booking.controller;

import com.dulich.booking.config.RabbitMQConfig;
import com.dulich.booking.entity.Booking;
import com.dulich.booking.entity.Payment;
import com.dulich.booking.event.PaymentFailedEvent;
import com.dulich.booking.event.PaymentSuccessEvent;
import com.dulich.booking.repository.BookingRepository;
import com.dulich.booking.service.PaymentService;
import com.dulich.booking.service.SepayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Webhook Controller — Receives payment notifications from SePay.
 *
 * This endpoint MUST bypass JWT authentication at the API Gateway
 * since SePay server calls it directly.
 *
 * SePay webhook payload:
 * {
 *   "id": 92704,
 *   "gateway": "TPBank",
 *   "transactionDate": "2024-07-02 11:08:33",
 *   "accountNumber": "06309937000",
 *   "code": "SEVN63DC8E5C",
 *   "content": "DH1234567890 Tour thanh toan",
 *   "transferType": "in",
 *   "transferAmount": 5000000,
 *   "referenceCode": "FT24012345678"
 * }
 */
@RestController
@RequestMapping("/payments/sepay")
@RequiredArgsConstructor
@Slf4j
public class SepayWebhookController {

    private final SepayService sepayService;
    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;
    private final RabbitTemplate rabbitTemplate;

    /**
     * Receive webhook from SePay after bank transfer is detected.
     * Must return 200 with {"success": true} quickly — SePay retries on failure.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handleWebhook(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody Map<String, Object> payload) {

        log.info("SePay webhook received: {}", payload);

        try {
            // Verify API key
            if (!sepayService.verifyWebhook(authHeader)) {
                log.warn("SePay webhook rejected: invalid API key");
                return ResponseEntity.ok(Map.of("success", false, "reason", "Invalid API key"));
            }

            // Only process incoming transfers
            String transferType = (String) payload.get("transferType");
            if (!"in".equals(transferType)) {
                log.info("SePay webhook ignored: transferType={}", transferType);
                return ResponseEntity.ok(Map.of("success", true));
            }

            // Extract orderCode from content field (transfer memo)
            String content = (String) payload.get("content");
            Long orderCode = sepayService.extractOrderCode(content);

            if (orderCode == null) {
                log.warn("SePay webhook: could not extract orderCode from content: {}", content);
                return ResponseEntity.ok(Map.of("success", true, "reason", "No matching order"));
            }

            log.info("SePay webhook verified: orderCode={}, amount={}, gateway={}",
                    orderCode, payload.get("transferAmount"), payload.get("gateway"));

            // Find payment by orderCode (stored as providerTransactionId)
            Payment payment = paymentService.findByProviderTransactionId(String.valueOf(orderCode));
            if (payment == null) {
                log.warn("No payment found for orderCode={}", orderCode);
                return ResponseEntity.ok(Map.of("success", true, "reason", "Payment not found"));
            }

            // Idempotency check — already processed
            if ("SUCCESS".equals(payment.getStatus()) || "FAILED".equals(payment.getStatus())) {
                log.info("Payment {} already in terminal state: {}", payment.getId(), payment.getStatus());
                return ResponseEntity.ok(Map.of("success", true));
            }

            // Verify amount matches
            Number transferAmount = (Number) payload.get("transferAmount");
            BigDecimal expectedAmount = payment.getAmount();
            if (transferAmount != null && new BigDecimal(transferAmount.toString()).compareTo(expectedAmount) >= 0) {
                // Payment success
                String providerData = payload.toString();
                paymentService.updatePaymentStatus(payment.getId(), "SUCCESS", providerData);
                updateBookingPaymentStatus(payment.getBookingId(), "PAID");
                log.info("SePay payment SUCCESS: paymentId={}, bookingId={}", payment.getId(), payment.getBookingId());

                // Publish payment.success event → triggers BookingEventHandler saga
                Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
                if (booking != null) {
                    PaymentSuccessEvent successEvent = PaymentSuccessEvent.builder()
                            .paymentId(payment.getId())
                            .bookingId(booking.getId())
                            .userId(booking.getUserId())
                            .amount(payment.getAmount())
                            .paymentMethod(payment.getPaymentMethod())
                            .providerTransactionId(payment.getProviderTransactionId())
                            .build();
                    rabbitTemplate.convertAndSend(
                            RabbitMQConfig.PAYMENT_EXCHANGE,
                            RabbitMQConfig.PAYMENT_SUCCESS_KEY,
                            successEvent
                    );
                    log.info("Published payment.success event for booking: {}", booking.getId());
                }
            } else {
                log.warn("SePay amount mismatch: expected={}, received={}",
                        expectedAmount, transferAmount);

                // Publish payment.failed event → triggers compensation (cancel + release seats)
                Booking booking = bookingRepository.findById(payment.getBookingId()).orElse(null);
                if (booking != null) {
                    PaymentFailedEvent failedEvent = PaymentFailedEvent.builder()
                            .bookingId(booking.getId())
                            .userId(booking.getUserId())
                            .reason("Amount mismatch: expected " + expectedAmount + ", received " + transferAmount)
                            .build();
                    rabbitTemplate.convertAndSend(
                            RabbitMQConfig.PAYMENT_EXCHANGE,
                            RabbitMQConfig.PAYMENT_FAILED_KEY,
                            failedEvent
                    );
                    log.info("Published payment.failed event for booking: {}", booking.getId());
                }
                return ResponseEntity.ok(Map.of("success", true, "reason", "Amount mismatch"));
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            log.error("SePay webhook processing failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("success", true));
        }
    }

    /**
     * Update booking's payment status after SePay confirms payment.
     */
    private void updateBookingPaymentStatus(Long bookingId, String paymentStatus) {
        bookingRepository.findById(bookingId).ifPresent(booking -> {
            booking.setPaymentStatus(paymentStatus);
            if ("PAID".equals(paymentStatus)) {
                booking.setPaidAt(LocalDateTime.now());
            }
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);
            log.info("Booking {} paymentStatus updated to {}", bookingId, paymentStatus);
        });
    }
}
