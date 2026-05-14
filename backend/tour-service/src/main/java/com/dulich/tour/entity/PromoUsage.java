package com.dulich.tour.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "promo_usages", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "promo_code"})
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PromoUsage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "promo_code", nullable = false, length = 50)
    private String promoCode;

    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "used_at", nullable = false) @Builder.Default
    private LocalDateTime usedAt = LocalDateTime.now();
}
