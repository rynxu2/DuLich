package com.dulich.analytics.service;

import com.dulich.analytics.entity.*;
import com.dulich.analytics.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final RevenueRecordRepository revenueRepo;
    private final CostRecordRepository costRepo;
    private final ProfitProjectionRepository profitRepo;

    // ═══════════════════ WRITE SIDE (Events) ═══════════════════

    @Transactional
    public void recordRevenue(Long bookingId, Long tourId, BigDecimal amount, String paymentMethod) {
        RevenueRecord record = RevenueRecord.builder()
                .bookingId(bookingId)
                .tourId(tourId)
                .amount(amount)
                .paymentMethod(paymentMethod)
                .build();
        revenueRepo.save(record);
        updateProfitProjection(tourId);
        log.info("Revenue recorded: bookingId={}, tourId={}, amount={}", bookingId, tourId, amount);
    }

    @Transactional
    public void recordCost(Long expenseId, Long tourId, String category, BigDecimal amount) {
        CostRecord record = CostRecord.builder()
                .expenseId(expenseId)
                .tourId(tourId)
                .category(category)
                .amount(amount)
                .build();
        costRepo.save(record);
        updateProfitProjection(tourId);
        log.info("Cost recorded: expenseId={}, tourId={}, category={}, amount={}", expenseId, tourId, category, amount);
    }

    private void updateProfitProjection(Long tourId) {
        BigDecimal revenue = revenueRepo.sumAmountByTourId(tourId);
        BigDecimal cost = costRepo.sumAmountByTourId(tourId);
        BigDecimal profit = revenue.subtract(cost);
        BigDecimal margin = revenue.compareTo(BigDecimal.ZERO) > 0
                ? profit.multiply(BigDecimal.valueOf(100)).divide(revenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        ProfitProjection projection = profitRepo.findByTourId(tourId)
                .orElse(ProfitProjection.builder().tourId(tourId).build());
        projection.setTotalRevenue(revenue);
        projection.setTotalCost(cost);
        projection.setProfit(profit);
        projection.setMarginPercent(margin);
        projection.setTotalBookings(revenueRepo.findByTourId(tourId).size());
        projection.setLastUpdated(LocalDateTime.now());
        profitRepo.save(projection);
    }

    // ═══════════════════ READ SIDE (Queries) ═══════════════════

    public Map<String, Object> getSystemRevenue() {
        BigDecimal total = revenueRepo.sumTotalRevenue();
        return Map.of(
                "totalRevenue", total,
                "totalRecords", revenueRepo.count(),
                "currency", "VND"
        );
    }

    public Map<String, Object> getSystemProfit() {
        BigDecimal totalRevenue = revenueRepo.sumTotalRevenue();
        BigDecimal totalCost = costRepo.sumTotalCost();
        BigDecimal profit = totalRevenue.subtract(totalCost);
        BigDecimal margin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? profit.multiply(BigDecimal.valueOf(100)).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return Map.of(
                "totalRevenue", totalRevenue,
                "totalCost", totalCost,
                "profit", profit,
                "marginPercent", margin,
                "currency", "VND"
        );
    }

    public ProfitProjection getTourProfit(Long tourId) {
        return profitRepo.findByTourId(tourId)
                .orElse(ProfitProjection.builder()
                        .tourId(tourId)
                        .totalRevenue(BigDecimal.ZERO)
                        .totalCost(BigDecimal.ZERO)
                        .profit(BigDecimal.ZERO)
                        .marginPercent(BigDecimal.ZERO)
                        .totalBookings(0)
                        .build());
    }

    public List<ProfitProjection> getAllProfitProjections() {
        return profitRepo.findAll();
    }

    public List<CostRecord> getCostBreakdown(Long tourId) {
        return costRepo.findByTourId(tourId);
    }
}
