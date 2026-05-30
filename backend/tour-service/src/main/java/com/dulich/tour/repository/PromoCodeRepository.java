package com.dulich.tour.repository;

import com.dulich.tour.entity.PromoCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PromoCodeRepository extends JpaRepository<PromoCode, Long> {
    Optional<PromoCode> findByCode(String code);

    /**
     * Atomically increment currentUses only if under maxUses.
     * Returns 1 if successful, 0 if promo is exhausted — no TOCTOU race.
     */
    @Modifying
    @Query("UPDATE PromoCode p SET p.currentUses = p.currentUses + 1 WHERE p.id = :id AND p.currentUses < p.maxUses")
    int incrementUsageAtomically(@Param("id") Long id);
}
