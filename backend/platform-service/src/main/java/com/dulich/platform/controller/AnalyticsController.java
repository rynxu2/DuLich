package com.dulich.platform.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Analytics Controller — REST API for analytics data
 *
 * GET /analytics/health         — Health check
 * GET /analytics/revenue        — Revenue summary
 * GET /analytics/profit/summary — Profit summary
 * GET /analytics/profit/all     — Profit by tour
 * GET /analytics/profit/tour/{id} — Profit for specific tour
 * GET /analytics/cost-breakdown/tour/{id} — Cost breakdown for tour
 */
@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "platform-service/analytics", "status", "UP"));
    }

    @GetMapping("/revenue")
    public ResponseEntity<?> getRevenue(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(Map.of(
            "totalRevenue", 0,
            "monthlyRevenue", Collections.emptyList(),
            "note", "Revenue is calculated client-side from booking data"
        ));
    }

    @GetMapping("/profit/summary")
    public ResponseEntity<?> getProfitSummary(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(Map.of(
            "totalRevenue", 0,
            "totalCost", 0,
            "profit", 0,
            "margin", 0
        ));
    }

    @GetMapping("/profit/all")
    public ResponseEntity<?> getAllProfits(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/profit/tour/{tourId}")
    public ResponseEntity<?> getTourProfit(@PathVariable Long tourId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(Map.of(
            "tourId", tourId,
            "totalRevenue", 0,
            "totalCost", 0,
            "profit", 0
        ));
    }

    @GetMapping("/cost-breakdown/tour/{tourId}")
    public ResponseEntity<?> getCostBreakdown(@PathVariable Long tourId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String role) {
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(403).body(Map.of("error", "Admin access required"));
        }
        return ResponseEntity.ok(Map.of(
            "tourId", tourId,
            "breakdown", Collections.emptyList()
        ));
    }
}
