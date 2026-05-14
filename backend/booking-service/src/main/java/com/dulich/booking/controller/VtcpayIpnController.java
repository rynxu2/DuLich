package com.dulich.booking.controller;

import com.dulich.booking.entity.Payment;
import com.dulich.booking.repository.BookingRepository;
import com.dulich.booking.service.PaymentService;
import com.dulich.booking.service.VtcpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * VTC Pay IPN Controller — Receives server-to-server payment notifications.
 *
 * VTC Pay sends POST with 'data' and 'signature' params after payment.
 * This endpoint MUST bypass JWT authentication at the API Gateway.
 */
@RestController
@RequestMapping("/payments/vtcpay")
@RequiredArgsConstructor
@Slf4j
public class VtcpayIpnController {

    private final VtcpayService vtcpayService;
    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;

    /**
     * Receive IPN from VTC Pay (server-to-server POST).
     * VTC Pay sends: data (encrypted/signed string) + signature
     */
    @PostMapping("/ipn")
    public ResponseEntity<Map<String, Object>> handleIpn(
            @RequestParam(value = "data", required = false) String data,
            @RequestParam(value = "signature", required = false) String signature,
            @RequestParam(value = "amount", required = false) String amount,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "payment_type", required = false) String paymentType,
            @RequestParam(value = "reference_number", required = false) String referenceNumber,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "trans_ref_no", required = false) String transRefNo,
            @RequestParam(value = "website_id", required = false) String websiteId) {

        log.info("VTC Pay IPN received: reference_number={}, status={}, amount={}", referenceNumber, status, amount);

        try {
            // Verify signature
            boolean valid = vtcpayService.verifyReturnSignature(
                    amount, message, paymentType, referenceNumber, status, transRefNo, websiteId, signature);

            if (!valid) {
                log.warn("VTC Pay IPN rejected: invalid signature");
                return ResponseEntity.ok(Map.of("status", "INVALID_SIGNATURE"));
            }

            if (referenceNumber == null || referenceNumber.isBlank()) {
                log.warn("VTC Pay IPN: missing reference_number");
                return ResponseEntity.ok(Map.of("status", "MISSING_REF"));
            }

            // Find payment by reference_number (stored as providerTransactionId)
            Payment payment = paymentService.findByProviderTransactionId(referenceNumber);
            if (payment == null) {
                log.warn("No payment found for reference_number={}", referenceNumber);
                return ResponseEntity.ok(Map.of("status", "NOT_FOUND"));
            }

            // Idempotency check
            if ("SUCCESS".equals(payment.getStatus()) || "FAILED".equals(payment.getStatus())) {
                log.info("Payment {} already in terminal state: {}", payment.getId(), payment.getStatus());
                return ResponseEntity.ok(Map.of("status", "ALREADY_PROCESSED"));
            }

            // Map VTC Pay status
            int statusCode = 0;
            try { statusCode = Integer.parseInt(status); } catch (Exception ignored) {}
            String internalStatus = vtcpayService.mapStatus(statusCode);

            // Verify amount matches
            if ("SUCCESS".equals(internalStatus) && amount != null) {
                long receivedAmount = 0;
                try { receivedAmount = Long.parseLong(amount); } catch (Exception ignored) {}
                if (receivedAmount < payment.getAmount().longValue()) {
                    log.warn("VTC Pay amount mismatch: expected={}, received={}", payment.getAmount(), receivedAmount);
                    internalStatus = "FAILED";
                }
            }

            // Build provider data string
            String providerData = String.format(
                    "VTCPAY_IPN|status=%s|trans_ref_no=%s|payment_type=%s|message=%s",
                    status, transRefNo, paymentType, message);

            paymentService.updatePaymentStatus(payment.getId(), internalStatus, providerData);

            // Update booking if success
            if ("SUCCESS".equals(internalStatus)) {
                bookingRepository.findById(payment.getBookingId()).ifPresent(booking -> {
                    booking.setPaymentStatus("PAID");
                    booking.setPaidAt(LocalDateTime.now());
                    booking.setUpdatedAt(LocalDateTime.now());
                    bookingRepository.save(booking);
                    log.info("Booking {} paymentStatus updated to PAID via VTC Pay IPN", booking.getId());
                });
            }

            log.info("VTC Pay IPN processed: paymentId={}, status={}", payment.getId(), internalStatus);
            return ResponseEntity.ok(Map.of("status", "OK"));
        } catch (Exception e) {
            log.error("VTC Pay IPN processing failed: {}", e.getMessage(), e);
            return ResponseEntity.ok(Map.of("status", "ERROR"));
        }
    }
}
