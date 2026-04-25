package com.dulich.booking.service;

import com.dulich.booking.client.ItineraryServiceClient;
import com.dulich.booking.client.IdentityServiceClient;
import com.dulich.booking.client.TourServiceClient;
import com.dulich.booking.dto.BookingRequest;
import com.dulich.booking.dto.BookingResponse;
import com.dulich.booking.dto.ItineraryRequest;
import com.dulich.booking.dto.ProfileStatsResponse;
import com.dulich.booking.dto.TourResponse;
import com.dulich.booking.entity.Booking;
import com.dulich.booking.repository.BookingRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Booking Service — Business logic with fault tolerance
 *
 * When a booking is created:
 * 1. Fetch tour info (price, itinerary template) from Tour Service
 * 2. Calculate total price and save booking
 * 3. Auto-create itinerary entries from tour template via Itinerary Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final TourServiceClient tourServiceClient;
    private final ItineraryServiceClient itineraryServiceClient;
    private final IdentityServiceClient identityServiceClient;

    /**
     * Create a new booking with circuit breaker protection.
     * After saving the booking, automatically generates itinerary
     * entries from the tour's itinerary template.
     */
    @CircuitBreaker(name = "tourService", fallbackMethod = "createBookingFallback")
    @Retry(name = "tourService")
    public Booking createBooking(Long userId, BookingRequest request) {
        TourResponse tour = null;
        BigDecimal totalPrice = BigDecimal.ZERO;

        // Step 1: Try to fetch tour info (circuit breaker protects this)
        try {
            tour = tourServiceClient.getTourById(request.getTourId());
            if (tour != null && tour.getPrice() != null) {
                totalPrice = tour.getPrice().multiply(BigDecimal.valueOf(request.getTravelers()));
            }
        } catch (Exception e) {
            log.warn("Could not fetch tour price for tourId={}: {}. Booking with price=0.",
                    request.getTourId(), e.getMessage());
        }

        // Step 2: Save the booking with PENDING status (requires admin confirmation)
        Booking booking = Booking.builder()
            .userId(userId)
            .tourId(request.getTourId())
            .bookingDate(request.getBookingDate())
            .travelers(request.getTravelers())
            .totalPrice(totalPrice)
            .contactName(request.getContactName())
            .contactPhone(request.getContactPhone())
            .specialRequests(request.getSpecialRequests())
            .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
            .status("PENDING")
            .build();

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking {} created with PENDING status for tourId={}", savedBooking.getId(), request.getTourId());

        return savedBooking;
    }

    /**
     * Parse tour's itinerary JSONB template and create itinerary entries.
     *
     * Expected JSONB format:
     * {
     *   "days": [
     *     {
     *       "day": 1,
     *       "activities": ["Activity 1", "Activity 2"]
     *     }
     *   ]
     * }
     */
    @SuppressWarnings("unchecked")
    private void createItineraryFromTemplate(Long bookingId, TourResponse tour) {
        Map<String, Object> itineraryTemplate = tour.getItinerary();
        if (itineraryTemplate == null || !itineraryTemplate.containsKey("days")) {
            log.info("Tour {} has no itinerary template, skipping auto-creation", tour.getId());
            return;
        }

        List<Map<String, Object>> days = (List<Map<String, Object>>) itineraryTemplate.get("days");
        List<ItineraryRequest> itineraryItems = new ArrayList<>();

        for (Map<String, Object> day : days) {
            Integer dayNumber = ((Number) day.get("day")).intValue();
            List<String> activities = (List<String>) day.get("activities");

            if (activities == null) continue;

            // Estimate start times: first activity at 07:30, then every 2-3 hours
            String[] defaultTimes = {"07:30", "10:00", "12:00", "14:00", "16:00", "18:30", "20:00"};

            for (int i = 0; i < activities.size(); i++) {
                String startTime = i < defaultTimes.length ? defaultTimes[i] : null;

                ItineraryRequest item = ItineraryRequest.builder()
                    .bookingId(bookingId)
                    .dayNumber(dayNumber)
                    .activityTitle(activities.get(i))
                    .description(null)
                    .startTime(startTime)
                    .location(null)
                    .status("PLANNED")
                    .build();

                itineraryItems.add(item);
            }
        }

        if (!itineraryItems.isEmpty()) {
            itineraryServiceClient.createBulkItinerary(itineraryItems);
            log.info("Created {} itinerary items for booking {}", itineraryItems.size(), bookingId);
        }
    }

    /**
     * Fallback when Tour Service is unavailable — create booking with totalPrice=0
     * instead of failing. Admin can update price later.
     */
    public Booking createBookingFallback(Long userId, BookingRequest request, Throwable t) {
        log.warn("Tour Service unavailable (fallback). Creating booking with price=0. Cause: {}", t.getMessage());
        Booking booking = Booking.builder()
            .userId(userId)
            .tourId(request.getTourId())
            .bookingDate(request.getBookingDate())
            .travelers(request.getTravelers())
            .totalPrice(BigDecimal.ZERO)
            .contactName(request.getContactName())
            .contactPhone(request.getContactPhone())
            .specialRequests(request.getSpecialRequests())
            .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH")
            .status("PENDING")
            .build();
        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get bookings enriched with tour info (title, location, image)
     */
    public List<BookingResponse> getBookingResponsesByUserId(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return bookings.stream().map(this::enrichBooking).toList();
    }

    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }

    public ProfileStatsResponse getProfileStatsByUserId(Long userId) {
        long trips = bookingRepository.countByUserId(userId);
        long reviews = 0;
        long favorites = 0;

        try {
            Long reviewCount = tourServiceClient.getReviewCountByUserId(userId);
            reviews = reviewCount != null ? reviewCount : 0;
        } catch (Exception e) {
            log.warn("Could not fetch review count for userId={}: {}", userId, e.getMessage());
        }

        try {
            Long favoriteCount = identityServiceClient.getFavoriteCountByUserId(userId);
            favorites = favoriteCount != null ? favoriteCount : 0;
        } catch (Exception e) {
            log.warn("Could not fetch favorite count for userId={}: {}", userId, e.getMessage());
        }

        return new ProfileStatsResponse(trips, reviews, favorites);
    }

    /**
     * Get single booking enriched with tour info
     */
    public BookingResponse getBookingResponseById(Long id) {
        Booking booking = getBookingById(id);
        return enrichBooking(booking);
    }

    public List<BookingResponse> getAllBookingResponses() {
        List<Booking> bookings = bookingRepository.findAll();
        return bookings.stream().map(this::enrichBooking).toList();
    }

    public Booking cancelBooking(Long id) {
        Booking booking = getBookingById(id);
        booking.setStatus("CANCELLED");
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    /**
     * Confirm a PENDING booking → CONFIRMED.
     * Auto-creates itinerary from tour template after confirmation.
     */
    @CircuitBreaker(name = "tourService", fallbackMethod = "confirmBookingFallback")
    public Booking confirmBooking(Long id) {
        Booking booking = getBookingById(id);
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể xác nhận booking ở trạng thái PENDING. Hiện tại: " + booking.getStatus());
        }
        booking.setStatus("CONFIRMED");
        booking.setUpdatedAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);

        // Auto-create itinerary from tour template after confirmation
        try {
            TourResponse tour = tourServiceClient.getTourById(booking.getTourId());
            if (tour != null) {
                createItineraryFromTemplate(saved.getId(), tour);
                log.info("Auto-created itinerary for confirmed booking {}", saved.getId());
            }
        } catch (Exception e) {
            log.warn("Failed to create itinerary for booking {}: {}", saved.getId(), e.getMessage());
        }

        log.info("Booking {} confirmed", id);
        return saved;
    }

    public Booking confirmBookingFallback(Long id, Throwable t) {
        log.warn("Tour Service unavailable during confirm. Confirming without itinerary. Cause: {}", t.getMessage());
        Booking booking = getBookingById(id);
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể xác nhận booking ở trạng thái PENDING. Hiện tại: " + booking.getStatus());
        }
        booking.setStatus("CONFIRMED");
        booking.setUpdatedAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    /**
     * Reject a PENDING booking → CANCELLED
     */
    public Booking rejectBooking(Long id) {
        Booking booking = getBookingById(id);
        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể từ chối booking ở trạng thái PENDING. Hiện tại: " + booking.getStatus());
        }
        booking.setStatus("CANCELLED");
        booking.setUpdatedAt(LocalDateTime.now());
        log.info("Booking {} rejected", id);
        return bookingRepository.save(booking);
    }

    /**
     * Complete a CONFIRMED booking -> COMPLETED
     */
    public Booking completeBooking(Long id) {
        Booking booking = getBookingById(id);
        if (!"CONFIRMED".equals(booking.getStatus())) {
            throw new RuntimeException("Chỉ có thể hoàn thành booking đang ở trạng thái CONFIRMED. Hiện tại: " + booking.getStatus());
        }
        booking.setStatus("COMPLETED");
        booking.setUpdatedAt(LocalDateTime.now());
        log.info("Booking {} completed", id);
        return bookingRepository.save(booking);
    }

    /**
     * Enrich a Booking with tour data from Tour Service.
     * If Tour Service is unavailable, returns booking without tour info.
     */
    private BookingResponse enrichBooking(Booking booking) {
        BookingResponse response = BookingResponse.fromBooking(booking);
        try {
            TourResponse tour = tourServiceClient.getTourById(booking.getTourId());
            response.withTourInfo(tour);
        } catch (Exception e) {
            log.warn("Could not fetch tour info for tourId={}: {}", booking.getTourId(), e.getMessage());
        }
        return response;
    }
}
