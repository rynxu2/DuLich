package com.dulich.analytics.controller;

import com.dulich.analytics.entity.CostRecord;
import com.dulich.analytics.entity.ProfitProjection;
import com.dulich.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Analytics Controller — Revenue, Profit, KPI dashboard.
 * Uses CQRS: reads from aggregated projections, writes via event consumers.
 */
@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "analytics-service", "status", "UP"));
    }

    // ═══════════════════ Revenue ═══════════════════

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenue() {
        return ResponseEntity.ok(analyticsService.getSystemRevenue());
    }

    // ═══════════════════ Profit ═══════════════════

    /** System-wide profit summary */
    @GetMapping("/profit/summary")
    public ResponseEntity<Map<String, Object>> getProfitSummary() {
        return ResponseEntity.ok(analyticsService.getSystemProfit());
    }

    /** Profit for a specific tour */
    @GetMapping("/profit/tour/{tourId}")
    public ResponseEntity<ProfitProjection> getTourProfit(@PathVariable Long tourId) {
        return ResponseEntity.ok(analyticsService.getTourProfit(tourId));
    }

    /** All tour profit projections */
    @GetMapping("/profit/all")
    public ResponseEntity<List<ProfitProjection>> getAllProfits() {
        return ResponseEntity.ok(analyticsService.getAllProfitProjections());
    }

    // ═══════════════════ Cost Breakdown ═══════════════════

    @GetMapping("/cost-breakdown/tour/{tourId}")
    public ResponseEntity<List<CostRecord>> getCostBreakdown(@PathVariable Long tourId) {
        return ResponseEntity.ok(analyticsService.getCostBreakdown(tourId));
    }
}
