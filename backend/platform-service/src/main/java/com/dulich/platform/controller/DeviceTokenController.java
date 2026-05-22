package com.dulich.platform.controller;

import com.dulich.platform.entity.DeviceToken;
import com.dulich.platform.repository.DeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/notifications/device-token")
@RequiredArgsConstructor
public class DeviceTokenController {

    private final DeviceTokenRepository repo;

    @PostMapping
    public ResponseEntity<?> register(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> body) {
        String token = body.get("token");
        String platform = body.getOrDefault("platform", "ANDROID");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "token is required"));
        }

        // Upsert: update if exists, create if not
        var existing = repo.findByToken(token);
        if (existing.isPresent()) {
            var dt = existing.get();
            dt.setUserId(userId);
            dt.setUpdatedAt(LocalDateTime.now());
            repo.save(dt);
        } else {
            repo.save(DeviceToken.builder()
                    .userId(userId)
                    .token(token)
                    .platform(platform)
                    .build());
        }

        return ResponseEntity.ok(Map.of("status", "registered"));
    }

    @DeleteMapping
    @Transactional
    public ResponseEntity<?> remove(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody Map<String, String> body) {
        String token = body.get("token");
        if (token != null) {
            repo.deleteByUserIdAndToken(userId, token);
        } else {
            repo.deleteByUserId(userId);
        }
        return ResponseEntity.ok(Map.of("status", "removed"));
    }
}
