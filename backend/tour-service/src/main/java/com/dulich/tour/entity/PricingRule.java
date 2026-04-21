package com.dulich.tour.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity @Table(name = "pricing_rules")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PricingRule {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, length = 20)
    private String type; // SEASONAL, GROUP, AGE, EARLYBIRD, LASTMINUTE, PROMO

    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> conditions;

    @Column(name = "modifier_type", nullable = false, length = 20)
    private String modifierType; // PERCENTAGE, FIXED

    @Column(name = "modifier_value", nullable = false)
    private BigDecimal modifierValue;

    @Column(nullable = false)
    private Integer priority;

    @Column(name = "is_active") @Builder.Default
    private Boolean isActive = true;

    @Column(name = "tour_id")
    private Long tourId;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "created_at", nullable = false, updatable = false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false) @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
