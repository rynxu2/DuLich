package com.dulich.itinerary.service;

import com.dulich.itinerary.entity.Itinerary;
import com.dulich.itinerary.repository.ItineraryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ItineraryService {

    private final ItineraryRepository itineraryRepository;

    public List<Itinerary> getItineraryByBookingId(Long bookingId) {
        return itineraryRepository.findByBookingIdOrderByDayNumberAscStartTimeAsc(bookingId);
    }

    public Itinerary createItinerary(Itinerary itinerary) {
        return itineraryRepository.save(itinerary);
    }

    public List<Itinerary> createBulkItinerary(List<Itinerary> itineraries) {
        return itineraryRepository.saveAll(itineraries);
    }

    public Itinerary updateItinerary(Long id, Itinerary details) {
        Itinerary itinerary = itineraryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Itinerary not found with id: " + id));
        itinerary.setDayNumber(details.getDayNumber());
        itinerary.setActivityTitle(details.getActivityTitle());
        itinerary.setDescription(details.getDescription());
        itinerary.setStartTime(details.getStartTime());
        itinerary.setLocation(details.getLocation());
        return itineraryRepository.save(itinerary);
    }
}
