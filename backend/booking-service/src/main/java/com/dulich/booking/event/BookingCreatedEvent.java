package com.dulich.booking.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * Published when a booking is created → triggers Payment Service (Saga Step 1).
 */
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BookingCreatedEvent implements Serializable {
    private Long bookingId;
    private Long userId;
    private Long tourId;
    private BigDecimal totalPrice;
    private String paymentMethod;
    private String contactName;
    private String contactPhone;
}
