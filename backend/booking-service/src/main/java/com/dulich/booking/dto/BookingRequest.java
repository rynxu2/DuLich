package com.dulich.booking.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class BookingRequest {
    @NotNull(message = "Tour ID is required")
    private Long tourId;

    @NotNull(message = "Booking date is required")
    private LocalDate bookingDate;

    @Min(value = 1, message = "Must have at least 1 traveler")
    private int travelers = 1;

    private String contactName;
    private String contactPhone;
    private String specialRequests;
    private String paymentMethod;
}
