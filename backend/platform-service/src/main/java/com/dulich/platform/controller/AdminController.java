package com.dulich.platform.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/admin")
public class AdminController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "platform-service/admin", "status", "UP"));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(Map.of(
            "service", "platform-service",
            "modules", new String[]{"notifications", "analytics", "admin", "storage"}
        ));
    }
}
