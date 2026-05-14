package com.dulich.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "notifications", indexes = {
    @Index(name = "idx_notif_user_id_read", columnList = "user_id, is_read"),
    @Index(name = "idx_notif_created_at", columnList = "created_at")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Notification {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30) @Builder.Default
    private String type = "SYSTEM";

    @Column(name = "reference_type", length = 30)
    private String referenceType;

    @Column(name = "reference_id")
    private Long referenceId;

    @Column(name = "is_read", nullable = false) @Builder.Default
    private Boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
