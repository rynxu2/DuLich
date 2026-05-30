package com.dulich.booking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class PaymentRequest {
    @NotNull
    private Long bookingId;

    @NotNull
    private Long userId;

    @NotNull
    @DecimalMin("1")
    private BigDecimal amount;

    private String paymentMethod;
}
