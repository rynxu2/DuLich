package com.dulich.booking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating itinerary entries via Itinerary Service.
 * Maps to the Itinerary entity on the itinerary-service side.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ItineraryRequest {
    private Long bookingId;
    private Integer dayNumber;
    private String activityTitle;
    private String description;
    private String startTime;   // "HH:mm" format
    private String location;
    private String status;      // PLANNED, COMPLETED, SKIPPED
}
