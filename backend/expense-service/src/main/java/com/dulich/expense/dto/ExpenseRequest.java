package com.dulich.expense.dto;

import com.dulich.expense.entity.ExpenseCategory;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class ExpenseRequest {
    @NotNull private Long tourId;
    private Long bookingId;
    private Long guideId;
    private Integer itineraryDay;
    @NotNull private ExpenseCategory category;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    private String currency;
    private String description;
}
