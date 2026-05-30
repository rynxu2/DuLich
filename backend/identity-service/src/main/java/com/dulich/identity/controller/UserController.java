package com.dulich.identity.controller;

import com.dulich.identity.dto.*;
import com.dulich.identity.dto.ProfileResponse;
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
    public ResponseEntity<?> listUsers(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String callerRole,
            @RequestParam(required = false) String role) {
        if (!"ADMIN".equals(callerRole)) {
            return ResponseEntity.status(403).body(null);
        }
        if (role != null && !role.isBlank()) {
            return ResponseEntity.ok(authService.getUsersByRole(role));
        }
        return ResponseEntity.ok(authService.getAllUsers());
    }

    @GetMapping("/users/{userId}/profile")
    public ResponseEntity<ProfileResponse> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(profileService.getProfile(userId));
    }

    @PutMapping("/users/{userId}/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            @PathVariable Long userId,
            @RequestBody UserProfile updates) {
        return ResponseEntity.ok(profileService.updateProfile(userId, updates));
    }

    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateRole(
            @RequestHeader(value = "X-User-Role", required = false) String callerRole,
            @PathVariable Long userId,
            @RequestBody Map<String, String> body) {
        if (!"ADMIN".equals(callerRole)) {
            return ResponseEntity.status(403).body(Map.of("message", "Only ADMIN can update roles"));
        }
        String newRole = body.get("role");
        if (newRole == null || newRole.isBlank()) {
            throw new RuntimeException("Role is required");
        }
        if (!List.of("USER", "GUIDE", "ADMIN").contains(newRole.toUpperCase())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid role. Must be USER, GUIDE, or ADMIN"));
        }
        return ResponseEntity.ok(authService.updateUserRole(userId, newRole.toUpperCase()));
    }

    @PostMapping("/users/guides")
    public ResponseEntity<?> createGuide(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role,
            @Valid @RequestBody RegisterRequest request) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(null);
        }
        return ResponseEntity.status(201).body(authService.createGuide(request));
    }
}
