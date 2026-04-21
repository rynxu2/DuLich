package com.dulich.tour.repository;

import com.dulich.tour.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {
    List<PricingRule> findByIsActiveTrueOrderByPriorityDesc();
    List<PricingRule> findByTourIdAndIsActiveTrueOrderByPriorityDesc(Long tourId);
}
