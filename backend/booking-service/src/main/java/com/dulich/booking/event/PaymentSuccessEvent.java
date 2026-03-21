package com.dulich.booking.event;

import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PaymentSuccessEvent implements Serializable {
    private Long paymentId;
    private Long bookingId;
    private Long userId;
    private BigDecimal amount;
    private String paymentMethod;
    private String providerTransactionId;
}
