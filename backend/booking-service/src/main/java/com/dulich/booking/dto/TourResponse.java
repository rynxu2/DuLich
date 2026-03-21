package com.dulich.booking.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.Map;

/**
 * DTO representing Tour data from Tour Service.
 * Used by Feign client to deserialize Tour Service response.
 */
@Data
public class TourResponse {
    private Long id;
    private String title;
    private String description;
    private String location;
    private BigDecimal price;
    private Integer duration;
    private BigDecimal rating;
    private Map<String, Object> itinerary;
    private String imageUrl;
}
