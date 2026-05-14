package com.dulich.tour.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PromoValidationResponse {
    private boolean valid;
    private String code;
    private String description;
    private String message;
    private Double discountPercent;
    private String discountType; // PERCENTAGE or FIXED
    private Double discountValue;
}
