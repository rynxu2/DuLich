package com.dulich.pricing.entity;

import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "pricing_rules")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PricingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    /** SEASONAL, GROUP, AGE, EARLYBIRD, LASTMINUTE, PROMO */
    @Column(nullable = false, length = 30)
    private String type;

    /**
     * JSON conditions, examples:
     * SEASONAL:  {"seasonStart":"06-01","seasonEnd":"08-31"}
     * GROUP:     {"minGroup":5}
     * AGE:       {"ageType":"CHILD"} or {"ageType":"INFANT"}
     * EARLYBIRD: {"daysBeforeDeparture":30}
     * LASTMINUTE:{"daysBeforeDeparture":3}
     */
    @Type(JsonType.class)
    @Column(columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> conditions;

    /** PERCENTAGE or FIXED */
    @Column(name = "modifier_type", nullable = false, length = 10)
    @Builder.Default
    private String modifierType = "PERCENTAGE";

    /** e.g. -10 means 10% discount, +20 means 20% surcharge */
    @Column(name = "modifier_value", nullable = false, precision = 10, scale = 2)
    private BigDecimal modifierValue;

    @Builder.Default
    private Integer priority = 0;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    /** NULL = applies to all tours */
    @Column(name = "tour_id")
    private Long tourId;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "created_at", updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
