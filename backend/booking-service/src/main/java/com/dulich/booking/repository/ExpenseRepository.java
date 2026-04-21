package com.dulich.booking.repository;

import com.dulich.booking.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findByTourIdOrderByCreatedAtDesc(Long tourId);
    List<Expense> findByGuideIdOrderByCreatedAtDesc(Long guideId);
    List<Expense> findByTourIdAndStatus(Long tourId, String status);
    List<Expense> findByStatusOrderByCreatedAtDesc(String status);
}
