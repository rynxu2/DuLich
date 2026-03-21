package com.dulich.pricing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class TourPriceInfo {
    private Long id;
    private String title;
    private BigDecimal price;
    private Integer maxParticipants;
}
