package com.dulich.user.controller;

import com.dulich.user.entity.Favorite;
import com.dulich.user.entity.UserProfile;
import com.dulich.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

    // ── Favorites ──
    @GetMapping("/favorites/user/{userId}")
    public ResponseEntity<List<Favorite>> getFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getFavorites(userId));
    }

    @PostMapping("/favorites")
    public ResponseEntity<Favorite> addFavorite(@RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(userService.addFavorite(body.get("userId"), body.get("tourId")));
    }

    @DeleteMapping("/favorites/{userId}/{tourId}")
    public ResponseEntity<Void> removeFavorite(@PathVariable Long userId, @PathVariable Long tourId) {
        userService.removeFavorite(userId, tourId);
        return ResponseEntity.ok().build();
    }
}
