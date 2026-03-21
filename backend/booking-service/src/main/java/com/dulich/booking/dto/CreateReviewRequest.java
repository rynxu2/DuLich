package com.dulich.booking.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateReviewRequest {
    private Long tourId;
    private Long bookingId;
    private BigDecimal rating;
    private String title;
    private String comment;
}
