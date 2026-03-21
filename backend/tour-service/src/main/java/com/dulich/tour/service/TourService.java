package com.dulich.tour.service;

import com.dulich.tour.entity.Tour;
import com.dulich.tour.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRepository tourRepository;
    private static final Map<String, List<String>> CATEGORY_LOCATION_MAP = Map.of(
        "beach", List.of("phu quoc", "phú quốc", "nha trang", "ha long", "hạ long"),
        "mountain", List.of("sapa", "sa pa", "da nang", "đà nẵng"),
        "city", List.of("ha noi", "hà nội", "tp.hcm", "tp.hồ chí minh", "hue", "huế", "bali", "tokyo", "bangkok", "paris"),
        "island", List.of("con dao", "côn đảo")
    );

    public List<Tour> getAllTours() {
        return tourRepository.findAll();
    }

    public List<Tour> listTours(String keyword, String category) {
        String normalizedKeyword = normalize(keyword);
        String normalizedCategory = normalize(category);

        boolean hasKeyword = !normalizedKeyword.isEmpty();
        boolean hasCategory = !normalizedCategory.isEmpty() && !"all".equals(normalizedCategory);

        if (!hasKeyword && !hasCategory) {
            return tourRepository.findAll();
        }

        if (hasKeyword && hasCategory) {
            return tourRepository.searchToursByKeywordAndCategory(normalizedKeyword, normalizedCategory);
        }

        if (hasKeyword) {
            return tourRepository.searchTours(normalizedKeyword);
        }

        return tourRepository.findByCategory(normalizedCategory);
    }

    public Tour getTourById(Long id) {
        return tourRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tour not found with id: " + id));
    }

    public List<Tour> searchTours(String keyword) {
        return tourRepository.searchTours(keyword);
    }

    public Tour createTour(Tour tour) {
        return tourRepository.save(tour);
    }

    public Tour updateTour(Long id, Tour tourDetails) {
        Tour tour = getTourById(id);
        tour.setTitle(tourDetails.getTitle());
        tour.setDescription(tourDetails.getDescription());
        tour.setLocation(tourDetails.getLocation());
        tour.setPrice(tourDetails.getPrice());
        tour.setDuration(tourDetails.getDuration());
        tour.setRating(tourDetails.getRating());
        tour.setItinerary(tourDetails.getItinerary());
        tour.setImageUrl(tourDetails.getImageUrl());
        return tourRepository.save(tour);
    }

    public void deleteTour(Long id) {
        Tour tour = getTourById(id);
        tourRepository.delete(tour);
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().toLowerCase(Locale.ROOT);
    }
}
