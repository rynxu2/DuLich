package com.dulich.booking.dto;

import com.dulich.booking.entity.ExpenseCategory;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExpenseRequest {
    private Long tourId;
    private Long bookingId;
    private Long guideId;
    private Integer itineraryDay;

    @NotNull
    private ExpenseCategory category;

    @NotNull
    private BigDecimal amount;

    private String currency;
    private String description;
}
