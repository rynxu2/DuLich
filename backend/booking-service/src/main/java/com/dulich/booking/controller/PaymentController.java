package com.dulich.booking.controller;

import com.dulich.booking.dto.PaymentRequest;
import com.dulich.booking.entity.Payment;
import com.dulich.booking.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/process")
    public ResponseEntity<Payment> processPayment(@Valid @RequestBody PaymentRequest request) {
        Payment payment = paymentService.processPayment(
            request.getBookingId(), request.getUserId(), request.getAmount());
        return ResponseEntity.ok(payment);
    }

    /**
     * Admin/staff endpoint to confirm cash payment has been received.
     */
    @PostMapping("/{id}/confirm-cash")
    public ResponseEntity<Payment> confirmCashPayment(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.confirmCashPayment(id));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Payment> getById(@PathVariable Long id) {
        return ResponseEntity.ok(paymentService.getById(id));
    }

    @GetMapping("/booking/{bookingId}")
    public ResponseEntity<List<Payment>> getByBooking(@PathVariable Long bookingId) {
        return ResponseEntity.ok(paymentService.getByBooking(bookingId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Payment>> getByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(paymentService.getByUser(userId));
    }
}
