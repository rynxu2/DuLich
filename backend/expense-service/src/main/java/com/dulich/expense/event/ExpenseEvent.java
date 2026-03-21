package com.dulich.expense.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ExpenseEvent {
    private Long expenseId;
    private Long tourId;
    private Long bookingId;
    private Long guideId;
    private String category;
    private BigDecimal amount;
    private String currency;
    private String status;
    private String eventType; // CREATED, APPROVED, REJECTED
}
