package com.dulich.tour.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Map;

@FeignClient(name = "booking-service", contextId = "bookingVerifyClient")
public interface BookingVerifyClient {

    @GetMapping("/bookings/check-completed")
    Map<String, Object> checkCompleted(@RequestParam("userId") Long userId,
                                         @RequestParam("tourId") Long tourId);
}
