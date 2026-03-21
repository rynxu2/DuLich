package com.dulich.admin.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

/**
 * Admin Controller — System configuration, policy management, audit logs.
 * Uses Feign Clients to aggregate data from all services.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "admin-service", "status", "UP"));
    }

    @GetMapping("/system/status")
    public ResponseEntity<Map<String, Object>> systemStatus() {
        return ResponseEntity.ok(Map.of(
            "services", 12,
            "infrastructure", Map.of(
                "rabbitmq", "UP",
                "redis", "UP",
                "elasticsearch", "UP",
                "postgres", "UP"
            )
        ));
    }
}
