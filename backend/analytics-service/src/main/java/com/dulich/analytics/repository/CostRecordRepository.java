package com.dulich.analytics.repository;

import com.dulich.analytics.entity.CostRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface CostRecordRepository extends JpaRepository<CostRecord, Long> {
    List<CostRecord> findByTourId(Long tourId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CostRecord c WHERE c.tourId = :tourId")
    BigDecimal sumAmountByTourId(Long tourId);

    @Query("SELECT COALESCE(SUM(c.amount), 0) FROM CostRecord c")
    BigDecimal sumTotalCost();
}
