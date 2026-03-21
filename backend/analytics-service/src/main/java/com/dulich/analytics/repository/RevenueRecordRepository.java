package com.dulich.analytics.repository;

import com.dulich.analytics.entity.RevenueRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface RevenueRecordRepository extends JpaRepository<RevenueRecord, Long> {
    List<RevenueRecord> findByTourId(Long tourId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RevenueRecord r WHERE r.tourId = :tourId")
    BigDecimal sumAmountByTourId(Long tourId);

    @Query("SELECT COALESCE(SUM(r.amount), 0) FROM RevenueRecord r")
    BigDecimal sumTotalRevenue();
}
