package com.dulich.tour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "promo_codes")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PromoCode {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "rule_id")
    private PricingRule rule;

    @Column(name = "max_uses") @Builder.Default
    private Integer maxUses = 100;

    @Column(name = "current_uses") @Builder.Default
    private Integer currentUses = 0;

    @Column(name = "valid_from")
    private LocalDateTime validFrom;

    @Column(name = "valid_until")
    private LocalDateTime validUntil;

    @Column(name = "is_active") @Builder.Default
    private Boolean isActive = true;
}
