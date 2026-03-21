package com.dulich.pricing.repository;

import com.dulich.pricing.entity.PricingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PricingRuleRepository extends JpaRepository<PricingRule, Long> {
    List<PricingRule> findByIsActiveTrueOrderByPriorityDesc();
    List<PricingRule> findByTourIdAndIsActiveTrueOrderByPriorityDesc(Long tourId);
}
