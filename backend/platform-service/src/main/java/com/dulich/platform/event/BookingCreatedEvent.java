package com.dulich.platform.event;

import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;

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
