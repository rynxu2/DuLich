package com.dulich.analytics.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "cost_records")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CostRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "expense_id", nullable = false)
    private Long expenseId;

    @Column(name = "tour_id", nullable = false)
    private Long tourId;

    @Column(nullable = false, length = 30)
    private String category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 10)
    @Builder.Default
    private String currency = "VND";

    @Column(name = "recorded_at", updatable = false)
    @Builder.Default
    private LocalDateTime recordedAt = LocalDateTime.now();
}
