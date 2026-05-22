package com.dulich.platform.scheduler;

import com.dulich.platform.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DepartureReminderScheduler {

    private final NotificationService notificationService;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Run daily at 8:00 AM Vietnam time.
     * Sends departure reminders 1 day and 3 days before departure.
     *
     * Note: This queries booking_db via cross-database link.
     * For now, uses a simple JDBC query since booking data is in Aiven
     * and all services share the same Aiven host.
     */
    @Scheduled(cron = "0 0 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void sendDepartureReminders() {
        log.info("Running departure reminder scheduler...");

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate threeDaysLater = LocalDate.now().plusDays(3);

        // For MVP: We create reminders based on a simple approach
        // In production, this should query booking-service via OpenFeign
        log.info("Departure reminder check for dates: {} and {}", tomorrow, threeDaysLater);

        // TODO: Integrate with tour-service to get departure dates
        // and booking-service to get user bookings for those dates.
        // For now, log that the scheduler is running.
        // This will be connected when we add OpenFeign client to platform-service.
    }
}
