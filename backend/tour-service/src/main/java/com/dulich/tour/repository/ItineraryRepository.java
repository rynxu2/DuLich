package com.dulich.tour.repository;

import com.dulich.tour.entity.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    List<Itinerary> findByBookingIdOrderByDayNumberAscStartTimeAsc(Long bookingId);
}
