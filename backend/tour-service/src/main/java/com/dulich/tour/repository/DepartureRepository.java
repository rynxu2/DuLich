package com.dulich.tour.repository;

import com.dulich.tour.entity.TourDeparture;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartureRepository extends JpaRepository<TourDeparture, Long> {

    List<TourDeparture> findByTourIdAndStatus(Long tourId, String status);

    /**
     * Atomic slot decrement — returns 1 if successful, 0 if not enough slots.
     * This prevents race conditions at the DB level.
     */
    @Modifying
    @Query("UPDATE TourDeparture d SET d.availableSlots = d.availableSlots - :count " +
           "WHERE d.id = :departureId AND d.availableSlots >= :count")
    int decrementSlots(@Param("departureId") Long departureId, @Param("count") int count);

    /**
     * Release previously reserved slots.
     */
    @Modifying
    @Query("UPDATE TourDeparture d SET d.availableSlots = d.availableSlots + :count " +
           "WHERE d.id = :departureId")
    int incrementSlots(@Param("departureId") Long departureId, @Param("count") int count);
}
