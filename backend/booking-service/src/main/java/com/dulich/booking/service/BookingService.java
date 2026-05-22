package com.dulich.booking.service;

import com.dulich.booking.client.ItineraryServiceClient;
import com.dulich.booking.client.IdentityServiceClient;
import com.dulich.booking.client.TourServiceClient;
import com.dulich.booking.dto.BookingRequest;
import com.dulich.booking.dto.BookingResponse;
import com.dulich.booking.dto.ItineraryRequest;
import com.dulich.booking.dto.SepayPaymentResult;
import com.dulich.booking.dto.PricePreviewResponse;
import com.dulich.booking.dto.ProfileStatsResponse;
import com.dulich.booking.dto.TourResponse;
import com.dulich.booking.entity.Booking;
import com.dulich.booking.entity.Expense;
import com.dulich.booking.repository.BookingRepository;
import com.dulich.booking.repository.ExpenseRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Booking Service — Business logic with fault tolerance
 *
 * When a booking is created:
 * 1. Fetch tour info (price, itinerary template) from Tour Service
 * 2. Calculate total price and save booking
 * 3. If paymentMethod=SEPAY: create SePay VietQR payment link
 * 4. Auto-create itinerary entries from tour template via Itinerary Service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ExpenseRepository expenseRepository;
    private final TourServiceClient tourServiceClient;
    private final ItineraryServiceClient itineraryServiceClient;
    private final IdentityServiceClient identityServiceClient;
    private final SimpMessagingTemplate messagingTemplate;
    private final SepayService sepayService;
    private final PaymentService paymentService;

    /**
     * Create a new booking with circuit breaker protection.
     * Calls PricingEngine for dynamic pricing (rules + promo codes).
     * Returns BookingResponse — includes checkoutUrl if paymentMethod=SEPAY.
     */
    @CircuitBreaker(name = "tourService", fallbackMethod = "createBookingFallback")
    @Retry(name = "tourService")
    public BookingResponse createBooking(Long userId, BookingRequest request) {
        TourResponse tour = null;
        BigDecimal totalPrice = BigDecimal.ZERO;
        BigDecimal originalPrice = BigDecimal.ZERO;
        BigDecimal discountAmount = BigDecimal.ZERO;

        // Step 1: Fetch tour info + calculate price via PricingEngine
        try {
            tour = tourServiceClient.getTourById(request.getTourId());
            if (tour != null && tour.getPrice() != null) {
                originalPrice = tour.getPrice().multiply(BigDecimal.valueOf(request.getTravelers()));

                // Call PricingEngine for dynamic pricing (rules + promo)
                try {
                    String depDate = request.getBookingDate() != null ? request.getBookingDate().toString() : null;
                    PricePreviewResponse pricing = tourServiceClient.previewPrice(
                        request.getTourId(),
                        request.getAdults() > 0 ? request.getAdults() : request.getTravelers(),
                        request.getChildren() > 0 ? request.getChildren() : null,
                        depDate,
                        request.getPromoCode()
                    );
                    if (pricing != null && pricing.getFinalPrice() != null) {
                        totalPrice = pricing.getFinalPrice();
                        discountAmount = pricing.getSavings() != null ? pricing.getSavings() : BigDecimal.ZERO;
                        log.info("PricingEngine: tourId={}, original={}, final={}, savings={}, rules={}",
                            request.getTourId(), originalPrice, totalPrice, discountAmount,
                            pricing.getAppliedRules() != null ? pricing.getAppliedRules().size() : 0);
                    } else {
                        totalPrice = originalPrice;
                    }
                } catch (Exception pe) {
                    log.warn("PricingEngine unavailable for tourId={}: {}. Using base price.",
                        request.getTourId(), pe.getMessage());
                    totalPrice = originalPrice;
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch tour price for tourId={}: {}. Booking with price=0.",
                    request.getTourId(), e.getMessage());
        }

        // Step 2: Save the booking with PENDING status + discount info
        String paymentMethod = request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH";
        // Normalize legacy "PAYOS" to "SEPAY"
        if ("PAYOS".equalsIgnoreCase(paymentMethod)) paymentMethod = "SEPAY";
        Booking booking = Booking.builder()
            .userId(userId)
            .tourId(request.getTourId())
            .departureId(request.getDepartureId())
            .bookingDate(request.getBookingDate())
            .travelers(request.getTravelers())
            .totalPrice(totalPrice)
            .originalPrice(originalPrice)
            .discountAmount(discountAmount)
            .promoCode(request.getPromoCode() != null ? request.getPromoCode().toUpperCase() : null)
            .contactName(request.getContactName())
            .contactPhone(request.getContactPhone())
            .specialRequests(request.getSpecialRequests())
            .paymentMethod(paymentMethod)
            .status("PENDING")
            .build();

        Booking savedBooking = bookingRepository.save(booking);
        log.info("Booking {} created: tourId={}, total={}, discount={}, promo={}",
            savedBooking.getId(), request.getTourId(), totalPrice, discountAmount, request.getPromoCode());

        // Step 3: Consume promo code (increment usage count + per-user tracking)
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            try {
                tourServiceClient.consumePromo(request.getPromoCode(), userId, savedBooking.getId());
            } catch (Exception e) {
                log.warn("Failed to consume promo {}: {}", request.getPromoCode(), e.getMessage());
            }
        }

        // Build response
        BookingResponse response = BookingResponse.fromBooking(savedBooking);
        if (tour != null) {
            response.withTourInfo(tour);
        }

        // Step 4: If SEPAY — create VietQR payment link and payment record
        if ("SEPAY".equalsIgnoreCase(paymentMethod)) {
            try {
                long orderCode = generateOrderCode(savedBooking.getId());
                String tourTitle = tour != null && tour.getTitle() != null ? tour.getTitle() : "Tour";
                String description = buildSepayDescription(tourTitle, savedBooking.getId(), request.getTravelers());

                SepayPaymentResult sepayResult = sepayService.createPaymentLink(orderCode, totalPrice, description);

                // Create payment record in PROCESSING state
                paymentService.processSepayPayment(
                    savedBooking.getId(), userId, totalPrice,
                    sepayResult.getCheckoutUrl(), orderCode
                );

                // Set SePay checkout info in response
                response.setCheckoutUrl(sepayResult.getCheckoutUrl());
                response.setQrCode(sepayResult.getQrCode());

                log.info("SePay payment link created for booking {}: {}", savedBooking.getId(), sepayResult.getQrCode());
            } catch (Exception e) {
                log.error("Failed to create SePay payment for booking {}: {}", savedBooking.getId(), e.getMessage());
                savedBooking.setPaymentStatus("PAYMENT_LINK_FAILED");
                savedBooking.setUpdatedAt(LocalDateTime.now());
                bookingRepository.save(savedBooking);
                response = BookingResponse.fromBooking(savedBooking);
                if (tour != null) response.withTourInfo(tour);
            }
        }

        // WebSocket notification
        try {
            messagingTemplate.convertAndSend("/topic/notifications", 
                Map.of("type", "NEW_BOOKING", "bookingId", savedBooking.getId(), "message", "New booking received!"));
        } catch (Exception e) {
            log.error("Failed to send WebSocket notification", e);
        }

        return response;
    }

    /**
     * Generate unique orderCode for SePay from bookingId.
     * Format: bookingId * 10000 + random suffix to avoid collision.
     */
    private long generateOrderCode(Long bookingId) {
        return bookingId * 10000 + (System.currentTimeMillis() % 10000);
    }

    /**
     * Build SePay description for transfer memo.
     * Format: "Tour #123 x2 khach"
     */
    private String buildSepayDescription(String tourTitle, Long bookingId, int travelers) {
        String desc = String.format("Tour #%d x%d khach", bookingId, travelers);
        return desc.length() > 20 ? desc.substring(0, 20) : desc;
    }

    /**
     * Parse tour's itinerary JSONB template and create itinerary entries.
     *
     * Supports TWO formats:
     *
     * Format 1 (nested): {"days": [{"day": 1, "activities": ["Activity 1"]}]}
     * Format 2 (flat map): {"Ngày 1": "line1\nline2", "Ngày 2": "..."}
     */
    @SuppressWarnings("unchecked")
    private void createItineraryFromTemplate(Long bookingId, TourResponse tour) {
        Map<String, Object> itineraryTemplate = tour.getItinerary();
        if (itineraryTemplate == null || itineraryTemplate.isEmpty()) {
            log.info("Tour {} has no itinerary template, skipping auto-creation", tour.getId());
            return;
        }

        List<ItineraryRequest> itineraryItems = new ArrayList<>();
        String[] defaultTimes = {"07:30", "10:00", "12:00", "14:00", "16:00", "18:30", "20:00"};

        if (itineraryTemplate.containsKey("days")) {
            // Format 1: nested {days: [{day: 1, activities: [...]}]}
            List<Map<String, Object>> days = (List<Map<String, Object>>) itineraryTemplate.get("days");
            for (Map<String, Object> day : days) {
                Integer dayNumber = ((Number) day.get("day")).intValue();
                List<String> activities = (List<String>) day.get("activities");
                if (activities == null) continue;

                for (int i = 0; i < activities.size(); i++) {
                    String startTime = i < defaultTimes.length ? defaultTimes[i] : null;
                    itineraryItems.add(ItineraryRequest.builder()
                        .bookingId(bookingId).dayNumber(dayNumber)
                        .activityTitle(activities.get(i))
                        .startTime(startTime).status("PLANNED").build());
                }
            }
        } else {
            // Format 2: flat map {"Ngày 1": "line1\nline2", "Ngày 2": "..."}
            int dayCounter = 1;
            for (Map.Entry<String, Object> entry : itineraryTemplate.entrySet()) {
                String key = entry.getKey();
                Object value = entry.getValue();

                // Extract day number from key like "Ngày 1", "Day 2", etc.
                int dayNumber = dayCounter++;
                try {
                    String digits = key.replaceAll("[^0-9]", "");
                    if (!digits.isEmpty()) dayNumber = Integer.parseInt(digits);
                } catch (NumberFormatException ignored) {}

                // Parse activities from value
                List<String> activities = new ArrayList<>();
                if (value instanceof String) {
                    String[] lines = ((String) value).split("\\n");
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (!trimmed.isEmpty()) activities.add(trimmed);
                    }
                } else if (value instanceof List) {
                    for (Object item : (List<?>) value) {
                        activities.add(String.valueOf(item));
                    }
                } else {
                    activities.add(String.valueOf(value));
                }

                for (int i = 0; i < activities.size(); i++) {
                    String startTime = i < defaultTimes.length ? defaultTimes[i] : null;
                    itineraryItems.add(ItineraryRequest.builder()
                        .bookingId(bookingId).dayNumber(dayNumber)
                        .activityTitle(activities.get(i))
                        .startTime(startTime).status("PLANNED").build());
                }
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
    public BookingResponse createBookingFallback(Long userId, BookingRequest request, Throwable t) {
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
        Booking saved = bookingRepository.save(booking);
        return BookingResponse.fromBooking(saved);
    }

    public List<Booking> getBookingsByUserId(Long userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Get bookings enriched with tour info (title, location, image)
     */
    public List<BookingResponse> getBookingResponsesByUserId(Long userId) {
        List<Booking> bookings = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return enrichBookings(bookings);
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
        return enrichBookings(bookings);
    }

    /** Paginated version for admin dashboard */
    public Page<BookingResponse> getAllBookingResponses(Pageable pageable) {
        Page<Booking> page = bookingRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<BookingResponse> enriched = enrichBookings(page.getContent());
        return new PageImpl<>(enriched, pageable, page.getTotalElements());
    }

    /** Paginated version for user booking history (mobile infinite scroll) */
    public Page<BookingResponse> getBookingResponsesByUserId(Long userId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        List<BookingResponse> enriched = enrichBookings(page.getContent());
        return new PageImpl<>(enriched, pageable, page.getTotalElements());
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
     * Enrich a single Booking with tour data from Tour Service.
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

    /**
     * Batch-enrich bookings: 1 Feign call for ALL unique tourIds instead of N calls.
     */
    private List<BookingResponse> enrichBookings(List<Booking> bookings) {
        if (bookings.isEmpty()) return List.of();

        Map<Long, TourResponse> tourMap = Collections.emptyMap();
        try {
            Set<Long> tourIds = bookings.stream()
                .map(Booking::getTourId)
                .collect(Collectors.toSet());
            List<TourResponse> tours = tourServiceClient.getToursByIds(new ArrayList<>(tourIds));
            tourMap = tours.stream()
                .collect(Collectors.toMap(TourResponse::getId, Function.identity(), (a, b) -> a));
        } catch (Exception e) {
            log.warn("Could not batch-fetch tour info: {}", e.getMessage());
        }

        final Map<Long, TourResponse> finalTourMap = tourMap;
        return bookings.stream().map(booking -> {
            BookingResponse response = BookingResponse.fromBooking(booking);
            TourResponse tour = finalTourMap.get(booking.getTourId());
            if (tour != null) response.withTourInfo(tour);
            return response;
        }).toList();
    }

    // ── Analytics Methods ──

    public List<Map<String, Object>> getProfitByTour() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Expense> approvedExpenses = expenseRepository.findByStatusOrderByCreatedAtDesc("APPROVED");

        // Revenue by tour
        Map<Long, BigDecimal> revenueByTour = allBookings.stream()
            .filter(b -> !"CANCELLED".equals(b.getStatus()))
            .collect(Collectors.groupingBy(Booking::getTourId,
                Collectors.reducing(BigDecimal.ZERO, Booking::getTotalPrice, BigDecimal::add)));

        // Cost by tour
        Map<Long, BigDecimal> costByTour = approvedExpenses.stream()
            .filter(e -> e.getTourId() != null)
            .collect(Collectors.groupingBy(Expense::getTourId,
                Collectors.reducing(BigDecimal.ZERO, Expense::getAmount, BigDecimal::add)));

        // Tour titles
        Map<Long, String> tourTitles = Map.of();
        try {
            Set<Long> allTourIds = new java.util.HashSet<>();
            allTourIds.addAll(revenueByTour.keySet());
            allTourIds.addAll(costByTour.keySet());
            if (!allTourIds.isEmpty()) {
                List<TourResponse> tours = tourServiceClient.getToursByIds(new ArrayList<>(allTourIds));
                tourTitles = tours.stream().collect(Collectors.toMap(TourResponse::getId, TourResponse::getTitle, (a, b) -> a));
            }
        } catch (Exception e) {
            log.warn("Could not fetch tour titles for analytics: {}", e.getMessage());
        }

        Set<Long> allIds = new java.util.HashSet<>();
        allIds.addAll(revenueByTour.keySet());
        allIds.addAll(costByTour.keySet());

        final Map<Long, String> titles = tourTitles;
        return allIds.stream().map(tourId -> {
            BigDecimal revenue = revenueByTour.getOrDefault(tourId, BigDecimal.ZERO);
            BigDecimal cost = costByTour.getOrDefault(tourId, BigDecimal.ZERO);
            BigDecimal profit = revenue.subtract(cost);
            return Map.<String, Object>of(
                "tourId", tourId,
                "tourTitle", titles.getOrDefault(tourId, "Tour #" + tourId),
                "totalRevenue", revenue,
                "totalCost", cost,
                "profit", profit
            );
        }).sorted((a, b) -> ((BigDecimal) b.get("profit")).compareTo((BigDecimal) a.get("profit"))).toList();
    }

    public Map<String, Object> getAnalyticsSummary() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Expense> allExpenses = expenseRepository.findAll();

        BigDecimal totalRevenue = allBookings.stream()
            .filter(b -> !"CANCELLED".equals(b.getStatus()))
            .map(Booking::getTotalPrice)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalApprovedExpenses = allExpenses.stream()
            .filter(e -> "APPROVED".equals(e.getStatus()))
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pendingExpenses = allExpenses.stream()
            .filter(e -> "PENDING".equals(e.getStatus()))
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingCount = allExpenses.stream().filter(e -> "PENDING".equals(e.getStatus())).count();

        BigDecimal profit = totalRevenue.subtract(totalApprovedExpenses);
        double margin = totalRevenue.compareTo(BigDecimal.ZERO) > 0
            ? profit.doubleValue() / totalRevenue.doubleValue() * 100 : 0;

        return Map.of(
            "totalRevenue", totalRevenue,
            "totalExpenses", totalApprovedExpenses,
            "profit", profit,
            "margin", Math.round(margin * 10) / 10.0,
            "pendingExpenses", pendingExpenses,
            "pendingCount", pendingCount
        );
    }

    public boolean hasCompletedBooking(Long userId, Long tourId) {
        return bookingRepository.existsByUserIdAndTourIdAndStatus(userId, tourId, "COMPLETED");
    }

    public long countCompletedBookings(Long userId, Long tourId) {
        return bookingRepository.countByUserIdAndTourIdAndStatus(userId, tourId, "COMPLETED");
    }
}
