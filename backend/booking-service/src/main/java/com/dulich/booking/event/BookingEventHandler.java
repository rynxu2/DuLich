package com.dulich.booking.event;

import com.dulich.booking.client.TourServiceClient;
import com.dulich.booking.config.RabbitMQConfig;
import com.dulich.booking.entity.Booking;
import com.dulich.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Saga Event Handlers for Booking Service.
 *
 * Listens to payment.success → confirms booking.
 * Listens to payment.failed → cancels booking (+ releases seats).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BookingEventHandler {

    private final BookingRepository bookingRepository;
    private final RabbitTemplate rabbitTemplate;
    private final TourServiceClient tourServiceClient;

    /**
     * SAGA STEP 3: Payment succeeded → Confirm booking.
     */
    @RabbitListener(queues = RabbitMQConfig.BOOKING_PAYMENT_QUEUE)
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        log.info("Payment SUCCESS received for bookingId={}", event.getBookingId());

        bookingRepository.findById(event.getBookingId()).ifPresent(booking -> {
            if (!"PENDING".equals(booking.getStatus())) {
                log.warn("Cannot confirm booking {} — current status is {}, expected PENDING", booking.getId(), booking.getStatus());
                return;
            }

            booking.setStatus("CONFIRMED");
            booking.setPaymentStatus("PAID");
            booking.setPaidAt(LocalDateTime.now());
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);

            log.info("Booking CONFIRMED: id={}", booking.getId());

            // Publish booking.confirmed → Notification + Itinerary services
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.BOOKING_EXCHANGE,
                    RabbitMQConfig.BOOKING_CONFIRMED_KEY,
                    event
            );
        });
    }

    /**
     * SAGA COMPENSATE: Payment failed → Cancel booking + release seats.
     */
    @RabbitListener(queues = RabbitMQConfig.BOOKING_PAYMENT_FAILED_QUEUE)
    public void handlePaymentFailed(PaymentFailedEvent event) {
        log.warn("Payment FAILED for bookingId={}, reason={}", event.getBookingId(), event.getReason());

        bookingRepository.findById(event.getBookingId()).ifPresent(booking -> {
            booking.setStatus("CANCELLED");
            booking.setPaymentStatus("FAILED");
            booking.setUpdatedAt(LocalDateTime.now());
            bookingRepository.save(booking);

            // Release seats if departure was booked
            if (booking.getDepartureId() != null) {
                try {
                    tourServiceClient.releaseSeats(booking.getDepartureId(), booking.getId(), booking.getTravelers());
                    log.info("Seats released for failed-payment booking: {}", booking.getId());
                } catch (Exception e) {
                    log.warn("Failed to release seats for booking {}: {}", booking.getId(), e.getMessage());
                }
            }

            log.info("Booking CANCELLED: id={}", booking.getId());
        });
    }
}
