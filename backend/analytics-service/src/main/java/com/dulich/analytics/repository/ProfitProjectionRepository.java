package com.dulich.analytics.repository;

import com.dulich.analytics.entity.ProfitProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProfitProjectionRepository extends JpaRepository<ProfitProjection, Long> {
    Optional<ProfitProjection> findByTourId(Long tourId);
}
