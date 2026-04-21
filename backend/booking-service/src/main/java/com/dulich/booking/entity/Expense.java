package com.dulich.booking.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity @Table(name = "expenses")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Expense {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tour_id")
    private Long tourId;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "guide_id")
    private Long guideId;

    @Column(name = "itinerary_day")
    private Integer itineraryDay;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ExpenseCategory category;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 10) @Builder.Default
    private String currency = "VND";

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20) @Builder.Default
    private String status = "PENDING";

    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "approved_by")
    private Long approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseAttachment> attachments;

    @Column(name = "created_at", nullable = false, updatable = false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false) @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
