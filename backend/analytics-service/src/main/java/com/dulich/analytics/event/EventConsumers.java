package com.dulich.analytics.event;

import com.dulich.analytics.config.RabbitMQConfig;
import com.dulich.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class EventConsumers {

    private final AnalyticsService analyticsService;

    /**
     * Consume payment.success events → record revenue
     */
    @RabbitListener(queues = RabbitMQConfig.PAYMENT_SUCCESS_QUEUE)
    public void onPaymentSuccess(Map<String, Object> event) {
        try {
            Long bookingId = toLong(event.get("bookingId"));
            Long tourId = toLong(event.get("tourId"));
            BigDecimal amount = toBigDecimal(event.get("amount"));
            String paymentMethod = (String) event.getOrDefault("paymentMethod", "UNKNOWN");

            analyticsService.recordRevenue(bookingId, tourId, amount, paymentMethod);
            log.info("Processed payment.success event: bookingId={}, tourId={}, amount={}", bookingId, tourId, amount);
        } catch (Exception e) {
            log.error("Failed to process payment.success event: {}", e.getMessage(), e);
        }
    }

    /**
     * Consume expense.approved events → record cost
     */
    @RabbitListener(queues = RabbitMQConfig.EXPENSE_APPROVED_QUEUE)
    public void onExpenseApproved(Map<String, Object> event) {
        try {
            Long expenseId = toLong(event.get("expenseId"));
            Long tourId = toLong(event.get("tourId"));
            String category = (String) event.getOrDefault("category", "UNEXPECTED");
            BigDecimal amount = toBigDecimal(event.get("amount"));

            analyticsService.recordCost(expenseId, tourId, category, amount);
            log.info("Processed expense.approved event: expenseId={}, tourId={}, amount={}", expenseId, tourId, amount);
        } catch (Exception e) {
            log.error("Failed to process expense.approved event: {}", e.getMessage(), e);
        }
    }

    private Long toLong(Object obj) {
        if (obj instanceof Number) return ((Number) obj).longValue();
        if (obj instanceof String) return Long.parseLong((String) obj);
        return 0L;
    }

    private BigDecimal toBigDecimal(Object obj) {
        if (obj instanceof Number) return BigDecimal.valueOf(((Number) obj).doubleValue());
        if (obj instanceof String) return new BigDecimal((String) obj);
        return BigDecimal.ZERO;
    }
}
