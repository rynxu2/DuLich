package com.dulich.realtime.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Map;

/**
 * WebSocket controller for real-time messaging.
 */
@Controller
@RequiredArgsConstructor
public class RealtimeController {

    @GetMapping("/realtime/health")
    @ResponseBody
    public Map<String, String> health() {
        return Map.of("service", "realtime-service", "status", "UP", "websocket", "ENABLED");
    }

    @MessageMapping("/chat.send")
    @SendTo("/topic/chat")
    public Map<String, Object> sendMessage(Map<String, Object> message) {
        message.put("timestamp", System.currentTimeMillis());
        return message;
    }

    @MessageMapping("/tracking.update")
    @SendTo("/topic/tracking")
    public Map<String, Object> updateTracking(Map<String, Object> location) {
        location.put("timestamp", System.currentTimeMillis());
        return location;
    }
}
