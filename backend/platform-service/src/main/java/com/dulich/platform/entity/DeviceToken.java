package com.dulich.platform.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "device_tokens", indexes = {
    @Index(name = "idx_device_token_user", columnList = "user_id")
}, uniqueConstraints = {
    @UniqueConstraint(name = "uk_device_token", columnNames = "token")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DeviceToken {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(nullable = false, length = 512)
    private String token;

    @Column(nullable = false, length = 10) @Builder.Default
    private String platform = "ANDROID";

    @Column(name = "created_at", nullable = false, updatable = false) @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at") @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
