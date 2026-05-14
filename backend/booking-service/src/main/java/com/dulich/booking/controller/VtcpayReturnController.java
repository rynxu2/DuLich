package com.dulich.booking.controller;

import com.dulich.booking.entity.Payment;
import com.dulich.booking.repository.BookingRepository;
import com.dulich.booking.service.PaymentService;
import com.dulich.booking.service.VtcpayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * VTC Pay Return Controller — Handles GET redirect after user completes payment.
 *
 * VTC Pay redirects the user's browser back to this URL with payment result params.
 * This controller verifies the result and redirects to the mobile deep link.
 */
@RestController
@RequestMapping("/payments/vtcpay")
@RequiredArgsConstructor
@Slf4j
public class VtcpayReturnController {

    private final VtcpayService vtcpayService;
    private final PaymentService paymentService;
    private final BookingRepository bookingRepository;

    /**
     * Handle VTC Pay return redirect (GET).
     *
     * Params: amount, message, payment_type, reference_number, status, trans_ref_no, website_id, signature
     * After verification, redirect to mobile deep link: dulich://payment/vtcpay/result?bookingId=X&status=Y
     */
    @GetMapping("/return")
    public ResponseEntity<Void> handleReturn(
            @RequestParam(value = "amount", required = false) String amount,
            @RequestParam(value = "message", required = false) String message,
            @RequestParam(value = "payment_type", required = false) String paymentType,
            @RequestParam(value = "reference_number", required = false) String referenceNumber,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "trans_ref_no", required = false) String transRefNo,
            @RequestParam(value = "website_id", required = false) String websiteId,
            @RequestParam(value = "signature", required = false) String signature) {

        log.info("VTC Pay return: reference_number={}, status={}", referenceNumber, status);

        String deepLink;

        try {
            // Verify signature
            boolean valid = vtcpayService.verifyReturnSignature(
                    amount, message, paymentType, referenceNumber, status, transRefNo, websiteId, signature);

            int statusCode = 0;
            try { statusCode = Integer.parseInt(status); } catch (Exception ignored) {}
            String internalStatus = vtcpayService.mapStatus(statusCode);

            // Try to find the booking ID from reference_number
            Long bookingId = null;
            if (referenceNumber != null) {
                Payment payment = paymentService.findByProviderTransactionId(referenceNumber);
                if (payment != null) {
                    bookingId = payment.getBookingId();

                    // Also update payment if IPN hasn't arrived yet (belt & suspenders)
                    if (valid && "PROCESSING".equals(payment.getStatus())) {
                        String providerData = String.format(
                                "VTCPAY_RETURN|status=%s|trans_ref_no=%s", status, transRefNo);
                        paymentService.updatePaymentStatus(payment.getId(), internalStatus, providerData);

                        if ("SUCCESS".equals(internalStatus)) {
                            bookingRepository.findById(bookingId).ifPresent(booking -> {
                                booking.setPaymentStatus("PAID");
                                booking.setPaidAt(LocalDateTime.now());
                                booking.setUpdatedAt(LocalDateTime.now());
                                bookingRepository.save(booking);
                            });
                        }
                    }
                }
            }

            // Build deep link for mobile app
            deepLink = String.format("dulich://payment/vtcpay/result?status=%s&bookingId=%s",
                    internalStatus, bookingId != null ? bookingId : "");

        } catch (Exception e) {
            log.error("VTC Pay return processing failed: {}", e.getMessage(), e);
            deepLink = "dulich://payment/vtcpay/result?status=ERROR";
        }

        // Redirect to deep link
        HttpHeaders headers = new HttpHeaders();
        headers.add(HttpHeaders.LOCATION, deepLink);
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }
}
