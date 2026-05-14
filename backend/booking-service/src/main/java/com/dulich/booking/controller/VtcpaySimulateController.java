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
 * VTC Pay Simulate Controller — Dev-only endpoint for testing card payment flow.
 *
 * Simulates a successful card payment by directly updating payment status,
 * bypassing the need for actual VTC Pay checkout or test cards.
 *
 * Only active when Spring profile "dev" or "default" is enabled.
 */
@RestController
@RequestMapping("/payments/vtcpay")
@RequiredArgsConstructor
@Slf4j
@Profile({"dev", "default"})
public class VtcpaySimulateController {

    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;

    /**
     * Simulate a successful VTC Pay card payment for a booking.
     *
     * POST /payments/vtcpay/simulate
     * Body: { "bookingId": 123 }
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
        log.info("[SIMULATE] Simulating VTC Pay payment for bookingId={}", bookingId);

        try {
            List<Payment> payments = paymentService.getByBooking(bookingId);
            Payment target = payments.stream()
                    .filter(p -> "VTCPAY".equals(p.getPaymentMethod()))
                    .filter(p -> "PROCESSING".equals(p.getStatus()))
                    .findFirst()
                    .orElse(null);

            if (target == null) {
                return ResponseEntity.badRequest().body(Map.of(
                        "success", false,
                        "error", "No PROCESSING VTC Pay payment found for bookingId=" + bookingId
                ));
            }

            String simulatedData = String.format(
                    "VTCPAY_SIMULATE|status=1|trans_ref_no=SIM%d|payment_type=VISA|date=%s",
                    System.currentTimeMillis() % 100000,
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
            );

            paymentService.updatePaymentStatus(target.getId(), "SUCCESS", simulatedData);

            bookingRepository.findById(bookingId).ifPresent(booking -> {
                booking.setPaymentStatus("PAID");
                booking.setPaidAt(LocalDateTime.now());
                booking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(booking);
            });

            log.info("[SIMULATE] VTC Pay payment {} marked SUCCESS for booking {}", target.getId(), bookingId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "paymentId", target.getId(),
                    "bookingId", bookingId,
                    "status", "SUCCESS",
                    "message", "Simulated VTC Pay card payment completed"
            ));
        } catch (Exception e) {
            log.error("[SIMULATE] VTC Pay failed for bookingId={}: {}", bookingId, e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }
}
