package com.dulich.tour.service;

import com.dulich.tour.entity.TourDeparture;
import com.dulich.tour.repository.DepartureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.cache.annotation.CacheEvict;
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
    private static final String CONFIRMED_PREFIX = "confirmed:";
    private static final Duration LOCK_TTL = Duration.ofMinutes(10);
    private static final Duration CONFIRMED_TTL = Duration.ofHours(24);

    /**
     * Phase 1: Temporarily reserve seats (Redis lock + availability check).
     *
     * @param departureId the departure to reserve seats for
     * @param bookingId   unique booking identifier (used as lock key)
     * @param seatCount   number of seats to reserve
     * @return true if reservation successful
     */
    public boolean reserveSeats(Long departureId, Long bookingId, int seatCount) {
        if (seatCount <= 0) {
            throw new IllegalArgumentException("Seat count must be positive: " + seatCount);
        }

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
    @CacheEvict(value = {"tour-detail", "tours", "tour-search"}, allEntries = true)
    public boolean confirmSeats(Long departureId, Long bookingId, int seatCount) {
        if (seatCount <= 0) {
            throw new IllegalArgumentException("Seat count must be positive: " + seatCount);
        }

        int updated = departureRepository.decrementSlots(departureId, seatCount);

        if (updated > 0) {
            // Only delete lock and set confirmed flag AFTER successful DB decrement
            String lockKey = LOCK_PREFIX + departureId + ":" + bookingId;
            redisTemplate.delete(lockKey);

            String confirmedKey = CONFIRMED_PREFIX + departureId + ":" + bookingId;
            redisTemplate.opsForValue().set(confirmedKey, String.valueOf(seatCount), CONFIRMED_TTL);

            log.info("Seats confirmed (DB decremented): departureId={}, bookingId={}, seats={}",
                    departureId, bookingId, seatCount);
            return true;
        }

        // Lock stays — caller should handle failure
        log.error("Failed to confirm seats (DB decrement failed): departureId={}, bookingId={}",
                departureId, bookingId);
        return false;
    }

    /**
     * Release seats (on cancellation or payment failure).
     * Removes Redis lock AND increments DB slots only if seats were previously confirmed.
     */
    @Transactional
    @CacheEvict(value = {"tour-detail", "tours", "tour-search"}, allEntries = true)
    public void releaseSeats(Long departureId, Long bookingId, int seatCount) {
        if (seatCount <= 0) {
            throw new IllegalArgumentException("Seat count must be positive: " + seatCount);
        }

        // Remove Redis lock (for pre-confirm cancellations)
        String lockKey = LOCK_PREFIX + departureId + ":" + bookingId;
        redisTemplate.delete(lockKey);

        // Only increment DB if seats were actually confirmed (decremented)
        String confirmedKey = CONFIRMED_PREFIX + departureId + ":" + bookingId;
        String confirmedValue = redisTemplate.opsForValue().get(confirmedKey);

        if (confirmedValue != null) {
            int updated = departureRepository.incrementSlots(departureId, seatCount);
            if (updated > 0) {
                log.info("Seats released (DB incremented): departureId={}, bookingId={}, seats={}",
                        departureId, bookingId, seatCount);
            } else {
                log.warn("Failed to increment slots on release: departureId={}, bookingId={}",
                        departureId, bookingId);
            }
            // Clean up the confirmation tracking key
            redisTemplate.delete(confirmedKey);
        } else {
            log.info("Seats released (lock only, no DB change): departureId={}, bookingId={}",
                    departureId, bookingId);
        }
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
