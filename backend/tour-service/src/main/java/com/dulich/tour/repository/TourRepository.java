package com.dulich.tour.repository;

import com.dulich.tour.entity.Tour;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TourRepository extends JpaRepository<Tour, Long> {

    /** Fetch a single tour with images + departures eagerly loaded */
    @EntityGraph(attributePaths = {"images", "departures"})
    Optional<Tour> findWithRelationsById(Long id);

    /** Search tours by title or location (case-insensitive) */
    @Query("SELECT t FROM Tour t WHERE " +
           "LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.location) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Tour> searchTours(@Param("keyword") String keyword);

    @Query("SELECT t FROM Tour t WHERE LOWER(t.location) IN :locations")
    List<Tour> findByLocations(@Param("locations") List<String> locations);

    @Query("SELECT t FROM Tour t WHERE " +
           "(LOWER(t.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.location) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "LOWER(t.category) = :category")
    List<Tour> searchToursByKeywordAndCategory(
        @Param("keyword") String keyword,
        @Param("category") String category
    );

    @Query("SELECT t FROM Tour t WHERE LOWER(t.category) = :category")
    List<Tour> findByCategory(@Param("category") String category);
}
