package com.dulich.booking.dto;

import com.dulich.booking.entity.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Booking Response DTO — Enriched with tour information.
 * Used for GET endpoints to provide complete booking data including tour details.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private Long userId;
    private Long tourId;
    private Long departureId;
    private LocalDate bookingDate;
    private Integer travelers;
    private String status;
    private BigDecimal totalPrice;
    private String contactName;
    private String contactPhone;
    private String specialRequests;
    private String paymentMethod;
    private String paymentStatus;
    private LocalDateTime paidAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Tour info (enriched from Tour Service)
    private String tourTitle;
    private String tourLocation;
    private String tourImage;
    private Integer tourDuration;
    private BigDecimal tourRating;

    /**
     * Convert Booking entity to BookingResponse (without tour info).
     */
    public static BookingResponse fromBooking(Booking booking) {
        return BookingResponse.builder()
                .id(booking.getId())
                .userId(booking.getUserId())
                .tourId(booking.getTourId())
                .departureId(booking.getDepartureId())
                .bookingDate(booking.getBookingDate())
                .travelers(booking.getTravelers())
                .status(booking.getStatus())
                .totalPrice(booking.getTotalPrice())
                .contactName(booking.getContactName())
                .contactPhone(booking.getContactPhone())
                .specialRequests(booking.getSpecialRequests())
                .paymentMethod(booking.getPaymentMethod())
                .paymentStatus(booking.getPaymentStatus())
                .paidAt(booking.getPaidAt())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    /**
     * Enrich this response with tour information.
     */
    public BookingResponse withTourInfo(TourResponse tour) {
        if (tour != null) {
            this.tourTitle = tour.getTitle();
            this.tourLocation = tour.getLocation();
            this.tourImage = tour.getImageUrl();
            this.tourDuration = tour.getDuration();
            this.tourRating = tour.getRating();
        }
        return this;
    }
}
