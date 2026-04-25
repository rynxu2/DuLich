package com.dulich.identity.service;

import com.dulich.identity.dto.*;
import com.dulich.identity.entity.RefreshToken;
import com.dulich.identity.entity.User;
import com.dulich.identity.entity.UserProfile;
import com.dulich.identity.repository.RefreshTokenRepository;
import com.dulich.identity.repository.UserProfileRepository;
import com.dulich.identity.repository.UserRepository;
import com.dulich.identity.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserProfileRepository userProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .role("USER")
            .build();
        user = userRepository.save(user);

        // Directly create profile (no RabbitMQ needed — same service)
        UserProfile profile = UserProfile.builder()
            .userId(user.getId())
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .build();
        userProfileRepository.save(profile);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        saveRefreshToken(user.getId(), refreshToken);

        log.info("User registered: {} (ID: {})", user.getUsername(), user.getId());

        return AuthResponse.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.getIsActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        saveRefreshToken(user.getId(), refreshToken);

        return AuthResponse.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
    }

    @Transactional
    public AuthResponse refreshToken(String token) {
        RefreshToken stored = refreshTokenRepository.findByToken(token)
            .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(stored);
            throw new RuntimeException("Refresh token expired");
        }

        User user = userRepository.findById(stored.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        // Rotate refresh token
        refreshTokenRepository.delete(stored);
        saveRefreshToken(user.getId(), newRefreshToken);

        return AuthResponse.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .accessToken(newAccessToken)
            .refreshToken(newRefreshToken)
            .build();
    }

    public UserResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        return toUserResponse(user);
    }

    public UserResponse updateUser(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getEmail() != null && !request.getEmail().isBlank()) user.setEmail(request.getEmail());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        return toUserResponse(user);
    }

    private void saveRefreshToken(Long userId, String token) {
        RefreshToken rt = RefreshToken.builder()
            .userId(userId)
            .token(token)
            .expiresAt(LocalDateTime.now().plusDays(7))
            .build();
        refreshTokenRepository.save(rt);
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phone(user.getPhone())
            .avatarUrl(user.getAvatarUrl())
            .role(user.getRole())
            .createdAt(user.getCreatedAt())
            .build();
    }

    public java.util.List<UserResponse> getUsersByRole(String role) {
        return userRepository.findByRoleAndIsActive(role, true)
            .stream().map(this::toUserResponse)
            .collect(java.util.stream.Collectors.toList());
    }

    public java.util.List<UserResponse> getAllUsers() {
        return userRepository.findAll()
            .stream().map(this::toUserResponse)
            .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public AuthResponse createGuide(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        User user = User.builder()
            .username(request.getUsername())
            .email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .role("GUIDE")
            .build();
        user = userRepository.save(user);

        UserProfile profile = UserProfile.builder()
            .userId(user.getId())
            .fullName(request.getFullName())
            .phone(request.getPhone())
            .build();
        userProfileRepository.save(profile);

        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());
        saveRefreshToken(user.getId(), refreshToken);

        log.info("Guide created: {} (ID: {})", user.getUsername(), user.getId());

        return AuthResponse.builder()
            .userId(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .role(user.getRole())
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .build();
    }

    @Transactional
    public UserResponse updateUserRole(Long userId, String newRole) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(newRole);
        user.setUpdatedAt(LocalDateTime.now());
        user = userRepository.save(user);
        log.info("User {} role updated to {}", userId, newRole);
        return toUserResponse(user);
    }
}
