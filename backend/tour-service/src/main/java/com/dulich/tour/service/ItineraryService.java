package com.dulich.tour.service;

import com.dulich.tour.entity.Itinerary;
import com.dulich.tour.repository.ItineraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;

    public List<Itinerary> getByBookingId(Long bookingId) {
        return itineraryRepository.findByBookingIdOrderByDayNumberAscStartTimeAsc(bookingId);
    }

    public Itinerary create(Itinerary itinerary) {
        return itineraryRepository.save(itinerary);
    }

    public List<Itinerary> createBulk(List<Itinerary> itineraries) {
        return itineraryRepository.saveAll(itineraries);
    }

    public Itinerary update(Long id, Itinerary details) {
        Itinerary it = itineraryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Itinerary not found: " + id));
        if (details.getDayNumber() != null) it.setDayNumber(details.getDayNumber());
        if (details.getActivityTitle() != null) it.setActivityTitle(details.getActivityTitle());
        if (details.getDescription() != null) it.setDescription(details.getDescription());
        if (details.getStartTime() != null) it.setStartTime(details.getStartTime());
        if (details.getLocation() != null) it.setLocation(details.getLocation());
        return itineraryRepository.save(it);
    }
}
