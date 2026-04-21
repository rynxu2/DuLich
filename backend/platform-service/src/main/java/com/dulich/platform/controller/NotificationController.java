package com.dulich.platform.controller;

import com.dulich.platform.entity.Notification;
import com.dulich.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService service;

    @GetMapping
    public ResponseEntity<List<Notification>> getAll(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getUserNotifications(userId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Object>> unreadCount(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.getUnreadCount(userId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Notification> markRead(@PathVariable Long id) {
        return ResponseEntity.ok(service.markAsRead(id));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead(@RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(service.markAllAsRead(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
