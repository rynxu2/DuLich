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
    public ResponseEntity<Map<String, Object>> getRevenue() {
        return ResponseEntity.ok(Map.of(
            "totalRevenue", 0,
            "monthlyRevenue", Collections.emptyList(),
            "note", "Revenue is calculated client-side from booking data"
        ));
    }

    @GetMapping("/profit/summary")
    public ResponseEntity<Map<String, Object>> getProfitSummary() {
        return ResponseEntity.ok(Map.of(
            "totalRevenue", 0,
            "totalCost", 0,
            "profit", 0,
            "margin", 0
        ));
    }

    @GetMapping("/profit/all")
    public ResponseEntity<List<Map<String, Object>>> getAllProfits() {
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/profit/tour/{tourId}")
    public ResponseEntity<Map<String, Object>> getTourProfit(@PathVariable Long tourId) {
        return ResponseEntity.ok(Map.of(
            "tourId", tourId,
            "totalRevenue", 0,
            "totalCost", 0,
            "profit", 0
        ));
    }

    @GetMapping("/cost-breakdown/tour/{tourId}")
    public ResponseEntity<Map<String, Object>> getCostBreakdown(@PathVariable Long tourId) {
        return ResponseEntity.ok(Map.of(
            "tourId", tourId,
            "breakdown", Collections.emptyList()
        ));
    }
}
