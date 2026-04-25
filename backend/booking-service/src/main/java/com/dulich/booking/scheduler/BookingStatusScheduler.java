package com.dulich.booking.scheduler;

import com.dulich.booking.client.TourServiceClient;
import com.dulich.booking.dto.TourResponse;
import com.dulich.booking.entity.Booking;
import com.dulich.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled job to automatically transition CONFIRMED bookings to COMPLETED
 * if the tour has finished based on its start date and duration.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingStatusScheduler {

    private final BookingRepository bookingRepository;
    private final TourServiceClient tourServiceClient;

    /**
     * Run every day at 01:00 AM
     * Cron expression: second minute hour day-of-month month day-of-week
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void autoCompleteBookings() {
        log.info("Starting scheduled job: Auto-complete CONFIRMED bookings");
        List<Booking> confirmedBookings = bookingRepository.findByStatus("CONFIRMED");

        if (confirmedBookings.isEmpty()) {
            log.info("No CONFIRMED bookings found to process.");
            return;
        }

        LocalDate today = LocalDate.now();
        int completedCount = 0;

        for (Booking booking : confirmedBookings) {
            try {
                // Fetch tour details to get duration
                TourResponse tour = tourServiceClient.getTourById(booking.getTourId());
                if (tour != null && tour.getDuration() != null) {
                    // Tour end date = booking date + duration (in days)
                    LocalDate startDate = booking.getBookingDate();
                    if (startDate != null) {
                        LocalDate endDate = startDate.plusDays(tour.getDuration());

                        // If today is after the end date, mark as completed
                        if (today.isAfter(endDate)) {
                            booking.setStatus("COMPLETED");
                            booking.setUpdatedAt(LocalDateTime.now());
                            bookingRepository.save(booking);
                            completedCount++;
                            log.info("Auto-completed booking ID {} (Tour ended on {})", booking.getId(), endDate);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to process auto-completion for booking ID {}: {}", booking.getId(), e.getMessage());
            }
        }

        log.info("Finished scheduled job: Auto-completed {} bookings", completedCount);
    }
}
