package com.dulich.pricing.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PricePreviewResponse {
    private Long tourId;
    private BigDecimal basePrice;
    private BigDecimal adultPrice;
    private BigDecimal childPrice;
    private int adults;
    private int children;
    private BigDecimal subtotal;
    private List<AppliedRule> appliedRules;
    private BigDecimal totalDiscount;
    private BigDecimal finalPrice;
    private BigDecimal savings;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AppliedRule {
        private String ruleName;
        private String type;
        private String modifierType;
        private BigDecimal modifierValue;
        private BigDecimal adjustedAmount;
    }
}
