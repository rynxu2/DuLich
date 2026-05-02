package com.dulich.booking.controller;

import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
@Slf4j
public class TrackingController {

    @MessageMapping("/tracking.update")
    @SendTo("/topic/tracking")
    public LocationUpdate processLocationUpdate(LocationUpdate update) {
        log.debug("Received location update for guide {} on tour {}: [{}, {}]", 
            update.getGuideId(), update.getTourId(), update.getLat(), update.getLng());
        return update; // Broadcasts to all subscribers of /topic/tracking
    }

    @Data
    public static class LocationUpdate {
        private Long guideId;
        private Long tourId;
        private Double lat;
        private Double lng;
        private String timestamp;
    }
}
