package com.dulich.identity.controller;

import com.dulich.identity.entity.UserProfile;
import com.dulich.identity.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final ProfileService profileService;

    @GetMapping("/users/{userId}/profile")
    public ResponseEntity<UserProfile> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping("/users/{userId}/profile")
    public ResponseEntity<UserProfile> updateProfile(
            @PathVariable Long userId,
            @RequestBody UserProfile updates) {
        return ResponseEntity.ok(profileService.updateProfile(userId, updates));
    }
}
