package com.dulich.tour.service;

import com.dulich.tour.entity.Tour;
import com.dulich.tour.repository.TourRepository;
import lombok.RequiredArgsConstructor;
import org.hibernate.Hibernate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TourService {

    private final TourRepository tourRepository;
    private static final Map<String, List<String>> CATEGORY_LOCATION_MAP = Map.of(
        "beach", List.of("phu quoc", "phú quốc", "nha trang", "ha long", "hạ long"),
        "mountain", List.of("sapa", "sa pa", "da nang", "đà nẵng"),
        "city", List.of("ha noi", "hà nội", "tp.hcm", "tp.hồ chí minh", "hue", "huế", "bali", "tokyo", "bangkok", "paris"),
        "island", List.of("con dao", "côn đảo")
    );

    public List<Tour> getAllTours() {
        List<Tour> tours = tourRepository.findAll();
        tours.forEach(this::initializeRelations);
        return tours;
    }

    /** Batch fetch for booking-service enrichment (no relations needed) */
    public List<Tour> getToursByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) return List.of();
        List<Tour> tours = tourRepository.findAllById(ids);
        tours.forEach(this::initializeRelations);
        return tours;
    }

    public List<Tour> listTours(String keyword, String category) {
        String normalizedKeyword = normalize(keyword);
        String normalizedCategory = normalize(category);

        boolean hasKeyword = !normalizedKeyword.isEmpty();
        boolean hasCategory = !normalizedCategory.isEmpty() && !"all".equals(normalizedCategory);

        List<Tour> tours;
        if (!hasKeyword && !hasCategory) {
            tours = tourRepository.findAll();
        } else if (hasKeyword && hasCategory) {
            tours = tourRepository.searchToursByKeywordAndCategory(normalizedKeyword, normalizedCategory);
        } else if (hasKeyword) {
            tours = tourRepository.searchTours(normalizedKeyword);
        } else {
            tours = tourRepository.findByCategory(normalizedCategory);
        }
        tours.forEach(this::initializeRelations);
        return tours;
    }

    public Tour getTourById(Long id) {
        Tour tour = tourRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Tour not found with id: " + id));
        initializeRelations(tour);
        return tour;
    }

    public List<Tour> searchTours(String keyword) {
        List<Tour> tours = tourRepository.searchTours(keyword);
        tours.forEach(this::initializeRelations);
        return tours;
    }

    @Transactional
    public Tour createTour(Tour tour) {
        // Set parent back-reference (Jackson @JsonIgnore skips this during deserialization)
        if (tour.getImages() != null) {
            tour.getImages().forEach(img -> img.setTour(tour));
        }
        if (tour.getDepartures() != null) {
            tour.getDepartures().forEach(dep -> dep.setTour(tour));
        }
        return tourRepository.save(tour);
    }

    @Transactional
    public Tour updateTour(Long id, Tour tourDetails) {
        Tour tour = getTourById(id);
        if (tourDetails.getTitle() != null) tour.setTitle(tourDetails.getTitle());
        if (tourDetails.getDescription() != null) tour.setDescription(tourDetails.getDescription());
        if (tourDetails.getLocation() != null) tour.setLocation(tourDetails.getLocation());
        if (tourDetails.getPrice() != null) tour.setPrice(tourDetails.getPrice());
        if (tourDetails.getDuration() != null) tour.setDuration(tourDetails.getDuration());
        if (tourDetails.getRating() != null) tour.setRating(tourDetails.getRating());
        if (tourDetails.getItinerary() != null) tour.setItinerary(tourDetails.getItinerary());
        if (tourDetails.getImageUrl() != null) tour.setImageUrl(tourDetails.getImageUrl());
        if (tourDetails.getMaxParticipants() != null) tour.setMaxParticipants(tourDetails.getMaxParticipants());
        if (tourDetails.getCategory() != null) tour.setCategory(tourDetails.getCategory());
        if (tourDetails.getIsActive() != null) tour.setIsActive(tourDetails.getIsActive());

        // Merge gallery images via cascade + orphanRemoval
        if (tourDetails.getImages() != null) {
            tour.getImages().clear();
            for (var img : tourDetails.getImages()) {
                img.setTour(tour);
                tour.getImages().add(img);
            }
        }

        // Merge departures via cascade + orphanRemoval
        if (tourDetails.getDepartures() != null) {
            tour.getDepartures().clear();
            for (var dep : tourDetails.getDepartures()) {
                dep.setTour(tour);
                tour.getDepartures().add(dep);
            }
        }

        return tourRepository.save(tour);
    }

    @Transactional
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

    /** Force-initialize LAZY collections within the @Transactional boundary */
    private void initializeRelations(Tour tour) {
        Hibernate.initialize(tour.getImages());
        Hibernate.initialize(tour.getDepartures());
    }
}
