package com.dulich.user.controller;

import com.dulich.user.entity.UserProfile;
import com.dulich.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // ── Profile ──
    @GetMapping("/users/{userId}/profile")
    public ResponseEntity<UserProfile> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @PutMapping("/users/{userId}/profile")
    public ResponseEntity<UserProfile> updateProfile(@PathVariable Long userId, @RequestBody UserProfile updates) {
        return ResponseEntity.ok(userService.updateProfile(userId, updates));
    }

    // Favorites endpoints have been moved to identity-service.
    // See: identity-service/controller/FavoriteController.java
    // Frontend routes: GET /favorites, POST /favorites/toggle/{tourId}, GET /favorites/check/{tourId}
}
