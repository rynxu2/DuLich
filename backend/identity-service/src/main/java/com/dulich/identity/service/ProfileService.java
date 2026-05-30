package com.dulich.identity.service;

import com.dulich.identity.dto.ProfileResponse;
import com.dulich.identity.entity.User;
import com.dulich.identity.entity.UserProfile;
import com.dulich.identity.repository.UserProfileRepository;
import com.dulich.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserProfileRepository profileRepository;
    private final UserRepository userRepository;

    public ProfileResponse getProfile(Long userId) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profile not found for userId: " + userId));
        String email = userRepository.findById(userId)
            .map(User::getEmail).orElse(null);
        return toProfileResponse(profile, email);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, UserProfile updates) {
        // 1. Update Profile
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> UserProfile.builder().userId(userId).build());

        if (updates.getFullName() != null) profile.setFullName(updates.getFullName());
        if (updates.getPhone() != null) profile.setPhone(updates.getPhone());
        if (updates.getAvatarUrl() != null) profile.setAvatarUrl(updates.getAvatarUrl());
        if (updates.getDateOfBirth() != null) profile.setDateOfBirth(updates.getDateOfBirth());
        if (updates.getAddress() != null) profile.setAddress(updates.getAddress());
        if (updates.getBio() != null) profile.setBio(updates.getBio());
        profile.setUpdatedAt(LocalDateTime.now());
        profile = profileRepository.save(profile);

        // 2. Sync core fields to User entity
        String email = null;
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            boolean changed = false;
            if (updates.getFullName() != null) { user.setFullName(updates.getFullName()); changed = true; }
            if (updates.getPhone() != null) { user.setPhone(updates.getPhone()); changed = true; }
            if (updates.getAvatarUrl() != null) { user.setAvatarUrl(updates.getAvatarUrl()); changed = true; }
            if (changed) {
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
            }
            email = user.getEmail();
        }

        return toProfileResponse(profile, email);
    }

    private ProfileResponse toProfileResponse(UserProfile profile, String email) {
        return ProfileResponse.builder()
            .id(profile.getId())
            .userId(profile.getUserId())
            .email(email)
            .fullName(profile.getFullName())
            .phone(profile.getPhone())
            .avatarUrl(profile.getAvatarUrl())
            .dateOfBirth(profile.getDateOfBirth())
            .address(profile.getAddress())
            .bio(profile.getBio())
            .createdAt(profile.getCreatedAt())
            .updatedAt(profile.getUpdatedAt())
            .build();
    }
}
