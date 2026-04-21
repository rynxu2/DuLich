package com.dulich.platform.service;

import com.dulich.platform.entity.Notification;
import com.dulich.platform.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository repo;

    public List<Notification> getUserNotifications(Long userId) {
        return repo.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Map<String, Object> getUnreadCount(Long userId) {
        return Map.of("unreadCount", repo.countByUserIdAndIsReadFalse(userId));
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
