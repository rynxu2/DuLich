package com.dulich.tour.repository;

import com.dulich.tour.entity.PromoUsage;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PromoUsageRepository extends JpaRepository<PromoUsage, Long> {
    boolean existsByUserIdAndPromoCode(Long userId, String promoCode);
}
