package com.dulich.itinerary.repository;

import com.dulich.itinerary.entity.Itinerary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItineraryRepository extends JpaRepository<Itinerary, Long> {
    List<Itinerary> findByBookingIdOrderByDayNumberAscStartTimeAsc(Long bookingId);
}
