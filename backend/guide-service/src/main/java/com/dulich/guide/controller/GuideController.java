package com.dulich.guide.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/guides")
@RequiredArgsConstructor
public class GuideController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "guide-service", "status", "UP"));
    }

    // TODO: Guide assignment, availability calendar, GPS tracking
}
