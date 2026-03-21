package com.dulich.tour.service;

import com.dulich.tour.entity.TourDeparture;
import com.dulich.tour.repository.DepartureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Map;

/**
 * Capacity Management — Anti-Overbooking Service
 *
 * Uses a two-phase approach:
 * 1. Redis distributed lock (TTL=10min) — fast temporary seat reservation
 * 2. Atomic DB UPDATE — permanent slot decrement on payment confirmation
 *
 * Flow:
 * reserveSeats() → Redis lock + check availability
 * confirmSeats() → Atomic DB decrement
 * releaseSeats()  → Remove Redis lock + restore DB slots if already decremented
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CapacityService {

    private final DepartureRepository departureRepository;
    private final StringRedisTemplate redisTemplate;

    private static final String LOCK_PREFIX = "seat_lock:";
    private static final Duration LOCK_TTL = Duration.ofMinutes(10);

    /**
     * Phase 1: Temporarily reserve seats (Redis lock + availability check).
     *
     * @param departureId the departure to reserve seats for
     * @param bookingId   unique booking identifier (used as lock key)
     * @param seatCount   number of seats to reserve
     * @return true if reservation successful
     */
    public boolean reserveSeats(Long departureId, Long bookingId, int seatCount) {
        TourDeparture departure = departureRepository.findById(departureId)
                .orElseThrow(() -> new RuntimeException("Departure not found: " + departureId));

        if (departure.getAvailableSlots() < seatCount) {
            log.warn("Not enough slots: departureId={}, available={}, requested={}",
                    departureId, departure.getAvailableSlots(), seatCount);
            return false;
        }

        // Set Redis lock: prevents double-booking while payment is processing
        String lockKey = LOCK_PREFIX + departureId + ":" + bookingId;
        Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, String.valueOf(seatCount), LOCK_TTL);

        if (Boolean.TRUE.equals(acquired)) {
            log.info("Seats reserved: departureId={}, bookingId={}, seats={}, TTL=10min",
                    departureId, bookingId, seatCount);
            return true;
        }

        log.warn("Could not acquire seat lock: departureId={}, bookingId={}", departureId, bookingId);
        return false;
    }

    /**
     * Phase 2: Confirm seats after payment success (atomic DB decrement).
     *
     * @param departureId the departure
     * @param bookingId   the booking
     * @param seatCount   seats to confirm
     * @return true if DB decrement was successful
     */
    @Transactional
    public boolean confirmSeats(Long departureId, Long bookingId, int seatCount) {
        int updated = departureRepository.decrementSlots(departureId, seatCount);

        // Remove the Redis lock
        String lockKey = LOCK_PREFIX + departureId + ":" + bookingId;
        redisTemplate.delete(lockKey);

        if (updated > 0) {
            log.info("Seats confirmed (DB decremented): departureId={}, bookingId={}, seats={}",
                    departureId, bookingId, seatCount);
            return true;
        }

        log.error("Failed to confirm seats (DB decrement failed): departureId={}, bookingId={}",
                departureId, bookingId);
        return false;
    }

    /**
     * Release seats (on payment failure or timeout).
     */
    @Transactional
    public void releaseSeats(Long departureId, Long bookingId, int seatCount) {
        // Remove Redis lock
        String lockKey = LOCK_PREFIX + departureId + ":" + bookingId;
        redisTemplate.delete(lockKey);

        log.info("Seats released: departureId={}, bookingId={}, seats={}",
                departureId, bookingId, seatCount);
    }

    /**
     * Get availability info for a departure.
     */
    public Map<String, Object> getAvailability(Long departureId) {
        TourDeparture departure = departureRepository.findById(departureId)
                .orElseThrow(() -> new RuntimeException("Departure not found: " + departureId));

        return Map.of(
                "departureId", departure.getId(),
                "totalSlots", departure.getTour().getMaxParticipants(),
                "availableSlots", departure.getAvailableSlots(),
                "status", departure.getStatus()
        );
    }
}
