package com.dulich.booking.client;

import com.dulich.booking.dto.PricePreviewResponse;
import com.dulich.booking.dto.TourResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.Map;

/**
 * Feign Client — Inter-service communication with Tour Service
 * 
 * Uses Eureka service discovery (name = "tour-service") to resolve
 * the URL dynamically. No hard-coded URLs needed.
 */
@FeignClient(name = "tour-service", contextId = "tourServiceClient")
public interface TourServiceClient {

    @GetMapping("/tours/{id}")
    TourResponse getTourById(@PathVariable("id") Long id);

    @GetMapping("/tours/batch")
    List<TourResponse> getToursByIds(@RequestParam("ids") List<Long> ids);

    @GetMapping("/reviews/user/{userId}/count")
    Long getReviewCountByUserId(@PathVariable("userId") Long userId);

    @GetMapping("/pricing/preview")
    PricePreviewResponse previewPrice(
        @RequestParam("tourId") Long tourId,
        @RequestParam("adults") int adults,
        @RequestParam(value = "children", required = false) Integer children,
        @RequestParam(value = "departureDate", required = false) String departureDate,
        @RequestParam(value = "promoCode", required = false) String promoCode);

    @PostMapping("/pricing/consume-promo")
    Boolean consumePromo(
        @RequestParam("code") String code,
        @RequestParam("userId") Long userId,
        @RequestParam(value = "bookingId", required = false) Long bookingId);

    @PostMapping("/tours/departures/{depId}/reserve")
    Map<String, Object> reserveSeats(
        @PathVariable("depId") Long depId,
        @RequestParam("bookingId") Long bookingId,
        @RequestParam(value = "seats", defaultValue = "1") int seats);

    @PostMapping("/tours/departures/{depId}/release")
    Map<String, Object> releaseSeats(
        @PathVariable("depId") Long depId,
        @RequestParam("bookingId") Long bookingId,
        @RequestParam(value = "seats", defaultValue = "1") int seats);

    @PostMapping("/tours/departures/{depId}/confirm")
    Map<String, Object> confirmSeats(
        @PathVariable("depId") Long depId,
        @RequestParam("bookingId") Long bookingId,
        @RequestParam(value = "seats", defaultValue = "1") int seats);
}
