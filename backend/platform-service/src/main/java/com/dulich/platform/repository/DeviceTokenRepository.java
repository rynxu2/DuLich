package com.dulich.platform.repository;

import com.dulich.platform.entity.DeviceToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    List<DeviceToken> findByUserId(Long userId);
    Optional<DeviceToken> findByToken(String token);
    void deleteByUserIdAndToken(Long userId, String token);
    void deleteByUserId(Long userId);
}
