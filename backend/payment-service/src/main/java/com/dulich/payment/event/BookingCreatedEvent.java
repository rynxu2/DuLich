package com.dulich.payment.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Event received from Booking Service when a booking is created.
 * Triggers payment processing (Saga Step 2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingCreatedEvent implements Serializable {
    private Long bookingId;
    private Long userId;
    private Long tourId;
    private BigDecimal totalPrice;
    private String paymentMethod; // VNPAY, MOMO, ZALOPAY, CASH
    private String contactName;
    private String contactPhone;
}
