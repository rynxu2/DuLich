package com.dulich.identity.controller;

import com.dulich.identity.dto.*;
import com.dulich.identity.entity.UserProfile;
import com.dulich.identity.service.AuthService;
import com.dulich.identity.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final ProfileService profileService;
    private final AuthService authService;

    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> listUsers(
            @RequestParam(required = false) String role) {
        if (role != null && !role.isBlank()) {
            return ResponseEntity.ok(authService.getUsersByRole(role));
        }
        return ResponseEntity.ok(authService.getAllUsers());
    }

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

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserResponse> updateRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            throw new RuntimeException("Role is required");
        }
        return ResponseEntity.ok(authService.updateUserRole(userId, newRole));
    }

    @PostMapping("/users/guides")
    public ResponseEntity<AuthResponse> createGuide(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(201).body(authService.createGuide(request));
    }
}
