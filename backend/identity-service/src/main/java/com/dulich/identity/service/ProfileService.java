package com.dulich.identity.service;

import com.dulich.identity.entity.UserProfile;
import com.dulich.identity.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserProfileRepository profileRepository;

    public UserProfile getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
            .orElseThrow(() -> new RuntimeException("Profile not found for userId: " + userId));
    }

    public UserProfile updateProfile(Long userId, UserProfile updates) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseGet(() -> UserProfile.builder().userId(userId).build());

        if (updates.getFullName() != null) profile.setFullName(updates.getFullName());
        if (updates.getPhone() != null) profile.setPhone(updates.getPhone());
        if (updates.getAvatarUrl() != null) profile.setAvatarUrl(updates.getAvatarUrl());
        if (updates.getDateOfBirth() != null) profile.setDateOfBirth(updates.getDateOfBirth());
        if (updates.getAddress() != null) profile.setAddress(updates.getAddress());
        if (updates.getBio() != null) profile.setBio(updates.getBio());
        profile.setUpdatedAt(LocalDateTime.now());
        return profileRepository.save(profile);
    }
}
