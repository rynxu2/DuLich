package com.dulich.pricing.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class PricePreviewRequest {
    private Long tourId;
    private Long departureId;
    private LocalDate departureDate;
    private int adults = 1;
    private int children = 0;
    private String promoCode;
}
