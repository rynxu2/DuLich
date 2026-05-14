package com.dulich.booking.controller;

import com.dulich.booking.entity.Payment;
import com.dulich.booking.repository.BookingRepository;
import com.dulich.booking.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * SePay Simulate Controller — Dev-only endpoint for testing payment flow.
 *
 * Simulates a successful bank transfer by directly updating payment status,
 * bypassing the need for actual SePay dashboard or real bank transfers.
 *
 * Only active when Spring profile "dev" or "default" is enabled.
 */
@RestController
@RequestMapping("/payments/sepay")
@RequiredArgsConstructor
@Slf4j
@Profile({"dev", "default"})
public class SepaySimulateController {

    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;

    /**
     * Simulate a successful SePay bank transfer for a booking.
     *
     * POST /payments/sepay/simulate
     * Body: { "bookingId": 123 }
     *
     * Finds the PROCESSING payment for this booking and marks it SUCCESS,
     * then updates the booking's paymentStatus to PAID.
     */
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulatePayment(@RequestBody Map<String, Object> request) {
        Number bookingIdNum = (Number) request.get("bookingId");
        if (bookingIdNum == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "bookingId is required"
            ));
        }

        Long bookingId = bookingIdNum.longValue();
        log.info("[SIMULATE] Simulating SePay payment for bookingId={}", bookingId);

        try {
            // Find the PROCESSING payment for this booking
            List<Payment> payments = paymentService.getByBooking(bookingId);
            Payment target = payments.stream()
                    .filter(p -> "SEPAY".equals(p.getPaymentMethod()))
                    .filter(p -> "PROCESSING".equals(p.getStatus()))
                    .findFirst()
                    .orElse(null);

            if (target == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "No PROCESSING SePay payment found for bookingId=" + bookingId
                ));
            }

            // Build simulated provider data
            String simulatedData = String.format(
                    "{\"id\":0,\"gateway\":\"Sandbox\",\"transactionDate\":\"%s\","
                    + "\"accountNumber\":\"SIMULATED\",\"code\":\"SIM%d\","
                    + "\"content\":\"DH%s simulated\",\"transferType\":\"in\","
                    + "\"transferAmount\":%d,\"referenceCode\":\"SIM%d\"}",
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")),
                    System.currentTimeMillis() % 100000,
                    target.getProviderTransactionId(),
                    target.getAmount().longValue(),
                    System.currentTimeMillis() % 100000
            );

            // Update payment to SUCCESS
            paymentService.updatePaymentStatus(target.getId(), "SUCCESS", simulatedData);

            // Update booking payment status
            bookingRepository.findById(bookingId).ifPresent(booking -> {
                booking.setPaymentStatus("PAID");
                booking.setPaidAt(LocalDateTime.now());
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
            });

            log.info("[SIMULATE] Payment {} marked SUCCESS for booking {}", target.getId(), bookingId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "paymentId", target.getId(),
                    "bookingId", bookingId,
                    "status", "SUCCESS",
                    "message", "Simulated payment completed successfully"
            ));
        } catch (Exception e) {
            log.error("[SIMULATE] Failed for bookingId={}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}
