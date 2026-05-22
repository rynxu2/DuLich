package com.dulich.platform.service;

import com.dulich.platform.entity.Notification;
import com.dulich.platform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository repo;
    private final FCMService fcmService;

    public List<Notification> getUserNotifications(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Map<String, Object> getUnreadCount(Long userId) {
        return Map.of("unreadCount", repo.countByUserIdAndIsReadFalse(userId));
    }

    @Transactional
    public Notification createNotification(Long userId, String title, String message,
                                           String type, String referenceType, Long referenceId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceType(referenceType)
                .referenceId(referenceId)
                .build();
        Notification saved = repo.save(notification);
        log.info("Notification created: id={}, userId={}, type={}", saved.getId(), userId, type);

        // Send FCM push (fire-and-forget, don't block DB transaction)
        try {
            fcmService.sendPush(userId, title, message, Map.of(
                    "type", type,
                    "referenceType", referenceType != null ? referenceType : "",
                    "referenceId", referenceId != null ? referenceId.toString() : ""
            ));
        } catch (Exception e) {
            log.warn("FCM push failed for userId={}: {}", userId, e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Notification markAsRead(Long id) {
        Notification n = repo.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
        n.setIsRead(true);
        return repo.save(n);
    }

    @Transactional
    public Map<String, Object> markAllAsRead(Long userId) {
        return Map.of("updated", repo.markAllAsRead(userId));
    }

    @Transactional
    public void delete(Long id) { repo.deleteById(id); }
}
