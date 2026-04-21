package com.dulich.user.service;

import com.dulich.user.config.RabbitMQConfig;
import com.dulich.user.entity.UserProfile;
import com.dulich.user.event.UserRegisteredEvent;
import com.dulich.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserProfileRepository profileRepository;

    /**
     * Listen for user.registered event → auto-create profile.
     */
    @RabbitListener(queues = RabbitMQConfig.USER_PROFILE_QUEUE)
    public void handleUserRegistered(UserRegisteredEvent event) {
        log.info("Received user.registered event: userId={}", event.getUserId());

        if (profileRepository.findByUserId(event.getUserId()).isEmpty()) {
            UserProfile profile = UserProfile.builder()
                    .userId(event.getUserId())
                    .fullName(event.getFullName())
                    .phone(event.getPhone())
                    .build();
            profileRepository.save(profile);
            log.info("Created profile for userId={}", event.getUserId());
        }
    }

    public UserProfile getProfile(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("Profile not found for userId: " + userId));
    }

    public UserProfile updateProfile(Long userId, UserProfile updates) {
        UserProfile profile = getProfile(userId);
        if (updates.getFullName() != null) profile.setFullName(updates.getFullName());
        if (updates.getPhone() != null) profile.setPhone(updates.getPhone());
        if (updates.getAvatarUrl() != null) profile.setAvatarUrl(updates.getAvatarUrl());
        if (updates.getDateOfBirth() != null) profile.setDateOfBirth(updates.getDateOfBirth());
        if (updates.getAddress() != null) profile.setAddress(updates.getAddress());
        if (updates.getBio() != null) profile.setBio(updates.getBio());
        profile.setUpdatedAt(java.time.LocalDateTime.now());
        return profileRepository.save(profile);
    }

    // Favorites are now managed exclusively by identity-service.
    // See: identity-service/controller/FavoriteController.java
}
