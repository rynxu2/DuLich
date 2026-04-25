package com.dulich.tour.controller;

import com.dulich.tour.entity.GuideSchedule;
import com.dulich.tour.service.GuideScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Guide Controller — REST API for guide schedule management
 *
 * GET    /guides/schedules              — List all schedules
 * GET    /guides/schedules/tour/{id}    — Get schedules by tour
 * GET    /guides/schedules/guide/{id}   — Get schedules by guide
 * POST   /guides/schedules              — Assign guide to tour
 * PUT    /guides/schedules/{id}/status  — Update schedule status
 * DELETE /guides/schedules/{id}         — Delete schedule
 */
@RestController
@RequestMapping("/guides")
@RequiredArgsConstructor
public class GuideController {

    private final GuideScheduleService scheduleService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "tour-service/guides", "status", "UP"));
    }

    @GetMapping("/schedules")
    public ResponseEntity<List<GuideSchedule>> listSchedules() {
        return ResponseEntity.ok(scheduleService.getAll());
    }

    @GetMapping("/schedules/tour/{tourId}")
    public ResponseEntity<List<GuideSchedule>> getByTour(@PathVariable Long tourId) {
        return ResponseEntity.ok(scheduleService.getByTour(tourId));
    }

    @GetMapping("/schedules/guide/{guideId}")
    public ResponseEntity<List<GuideSchedule>> getByGuide(@PathVariable Long guideId) {
        return ResponseEntity.ok(scheduleService.getByGuide(guideId));
    }

    @PostMapping("/schedules")
    public ResponseEntity<GuideSchedule> assign(@RequestBody GuideSchedule schedule) {
        return ResponseEntity.ok(scheduleService.assign(schedule));
    }

    @PutMapping("/schedules/{id}/status")
    public ResponseEntity<GuideSchedule> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        return ResponseEntity.ok(scheduleService.updateStatus(id, status));
    }

    @DeleteMapping("/schedules/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
