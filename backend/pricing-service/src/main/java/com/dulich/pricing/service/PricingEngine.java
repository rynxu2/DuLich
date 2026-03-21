package com.dulich.pricing.service;

import com.dulich.pricing.client.TourServiceClient;
import com.dulich.pricing.dto.*;
import com.dulich.pricing.dto.PricePreviewResponse.AppliedRule;
import com.dulich.pricing.entity.PricingRule;
import com.dulich.pricing.entity.PromoCode;
import com.dulich.pricing.repository.PricingRuleRepository;
import com.dulich.pricing.repository.PromoCodeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.MonthDay;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Dynamic Pricing Engine — Evaluates pricing rules in priority order.
 *
 * Rule evaluation order (by priority desc):
 * 1. SEASONAL  — peak/off-peak season surcharges/discounts
 * 2. GROUP     — group discount when travelers >= threshold
 * 3. AGE       — child/infant pricing
 * 4. EARLYBIRD — early booking discount
 * 5. LASTMINUTE — last-minute surcharge
 * 6. PROMO     — promotional code discount (via PromoCode table)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PricingEngine {

    private final PricingRuleRepository ruleRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final TourServiceClient tourServiceClient;

    public PricePreviewResponse calculatePrice(PricePreviewRequest request) {
        // 1. Fetch base price from Tour Service
        TourPriceInfo tour;
        try {
            tour = tourServiceClient.getTourById(request.getTourId());
        } catch (Exception e) {
            log.error("Cannot fetch tour price for tourId={}: {}", request.getTourId(), e.getMessage());
            throw new RuntimeException("Unable to fetch tour price. Tour Service may be unavailable.");
        }

        BigDecimal basePrice = tour.getPrice();
        int totalPeople = request.getAdults() + request.getChildren();
        BigDecimal adultPrice = basePrice;
        BigDecimal childPrice = basePrice; // will be adjusted by AGE rule
        List<AppliedRule> appliedRules = new ArrayList<>();

        // 2. Load applicable rules (tour-specific + global, sorted by priority desc)
        List<PricingRule> rules = loadApplicableRules(request.getTourId());

        // 3. Evaluate each rule
        BigDecimal runningModifier = BigDecimal.ZERO; // cumulative percentage modifier

        for (PricingRule rule : rules) {
            if (!isRuleValid(rule)) continue;

            Map<String, Object> cond = rule.getConditions();
            boolean matches = false;
            String ruleType = rule.getType();

            switch (ruleType) {
                case "SEASONAL":
                    matches = evaluateSeasonal(cond, request.getDepartureDate());
                    break;
                case "GROUP":
                    matches = evaluateGroup(cond, totalPeople);
                    break;
                case "AGE":
                    // AGE rules adjust childPrice, not the overall modifier
                    if (request.getChildren() > 0 && evaluateAge(cond)) {
                        BigDecimal childMod = rule.getModifierValue();
                        childPrice = applyModifier(basePrice, childMod, rule.getModifierType());
                        appliedRules.add(AppliedRule.builder()
                                .ruleName(rule.getName())
                                .type(ruleType)
                                .modifierType(rule.getModifierType())
                                .modifierValue(rule.getModifierValue())
                                .adjustedAmount(childPrice.subtract(basePrice).multiply(BigDecimal.valueOf(request.getChildren())))
                                .build());
                    }
                    continue; // don't add to runningModifier
                case "EARLYBIRD":
                    matches = evaluateEarlyBird(cond, request.getDepartureDate());
                    break;
                case "LASTMINUTE":
                    matches = evaluateLastMinute(cond, request.getDepartureDate());
                    break;
                case "PROMO":
                    continue; // handled separately via promo code
                default:
                    continue;
            }

            if (matches) {
                BigDecimal adjustment;
                if ("PERCENTAGE".equals(rule.getModifierType())) {
                    runningModifier = runningModifier.add(rule.getModifierValue());
                    adjustment = basePrice.multiply(rule.getModifierValue())
                            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                            .multiply(BigDecimal.valueOf(totalPeople));
                } else {
                    adjustment = rule.getModifierValue().multiply(BigDecimal.valueOf(totalPeople));
                }

                appliedRules.add(AppliedRule.builder()
                        .ruleName(rule.getName())
                        .type(ruleType)
                        .modifierType(rule.getModifierType())
                        .modifierValue(rule.getModifierValue())
                        .adjustedAmount(adjustment)
                        .build());
            }
        }

        // 4. Apply promo code if present
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            applyPromoCode(request.getPromoCode(), basePrice, totalPeople, appliedRules);
        }

        // 5. Calculate final price
        adultPrice = applyModifier(basePrice, runningModifier, "PERCENTAGE");
        BigDecimal subtotal = adultPrice.multiply(BigDecimal.valueOf(request.getAdults()))
                .add(childPrice.multiply(BigDecimal.valueOf(request.getChildren())));

        BigDecimal totalAdjustment = appliedRules.stream()
                .map(AppliedRule::getAdjustedAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal finalPrice = subtotal.add(totalAdjustment).max(BigDecimal.ZERO);
        BigDecimal originalTotal = basePrice.multiply(BigDecimal.valueOf(totalPeople));
        BigDecimal savings = originalTotal.subtract(finalPrice).max(BigDecimal.ZERO);

        return PricePreviewResponse.builder()
                .tourId(request.getTourId())
                .basePrice(basePrice)
                .adultPrice(adultPrice)
                .childPrice(childPrice)
                .adults(request.getAdults())
                .children(request.getChildren())
                .subtotal(subtotal)
                .appliedRules(appliedRules)
                .totalDiscount(totalAdjustment.abs())
                .finalPrice(finalPrice)
                .savings(savings)
                .build();
    }

    private List<PricingRule> loadApplicableRules(Long tourId) {
        List<PricingRule> tourRules = ruleRepository.findByTourIdAndIsActiveTrueOrderByPriorityDesc(tourId);
        List<PricingRule> globalRules = ruleRepository.findByIsActiveTrueOrderByPriorityDesc()
                .stream().filter(r -> r.getTourId() == null).collect(Collectors.toList());

        // Merge: tour-specific rules take precedence (appear first)
        List<PricingRule> merged = new ArrayList<>(tourRules);
        Set<String> tourRuleTypes = tourRules.stream().map(PricingRule::getType).collect(Collectors.toSet());
        for (PricingRule gr : globalRules) {
            if (!tourRuleTypes.contains(gr.getType())) {
                merged.add(gr);
            }
        }
        return merged;
    }

    private boolean isRuleValid(PricingRule rule) {
        LocalDateTime now = LocalDateTime.now();
        if (rule.getValidFrom() != null && now.isBefore(rule.getValidFrom())) return false;
        if (rule.getValidUntil() != null && now.isAfter(rule.getValidUntil())) return false;
        return true;
    }

    private boolean evaluateSeasonal(Map<String, Object> cond, LocalDate departureDate) {
        if (departureDate == null) return false;
        String startStr = (String) cond.get("seasonStart"); // "MM-dd"
        String endStr = (String) cond.get("seasonEnd");
        if (startStr == null || endStr == null) return false;

        MonthDay start = MonthDay.parse("--" + startStr);
        MonthDay end = MonthDay.parse("--" + endStr);
        MonthDay dep = MonthDay.from(departureDate);

        if (start.isBefore(end) || start.equals(end)) {
            return !dep.isBefore(start) && !dep.isAfter(end);
        } else {
            // Wraps around year (e.g., Nov to Feb)
            return !dep.isBefore(start) || !dep.isAfter(end);
        }
    }

    private boolean evaluateGroup(Map<String, Object> cond, int totalPeople) {
        Object minObj = cond.get("minGroup");
        int minGroup = minObj instanceof Number ? ((Number) minObj).intValue() : 5;
        return totalPeople >= minGroup;
    }

    private boolean evaluateAge(Map<String, Object> cond) {
        // Always applicable if rule type is AGE and children > 0
        return cond.containsKey("ageType");
    }

    private boolean evaluateEarlyBird(Map<String, Object> cond, LocalDate departureDate) {
        if (departureDate == null) return false;
        Object daysObj = cond.get("daysBeforeDeparture");
        int daysRequired = daysObj instanceof Number ? ((Number) daysObj).intValue() : 30;
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), departureDate);
        return daysUntil >= daysRequired;
    }

    private boolean evaluateLastMinute(Map<String, Object> cond, LocalDate departureDate) {
        if (departureDate == null) return false;
        Object daysObj = cond.get("daysBeforeDeparture");
        int daysThreshold = daysObj instanceof Number ? ((Number) daysObj).intValue() : 3;
        long daysUntil = ChronoUnit.DAYS.between(LocalDate.now(), departureDate);
        return daysUntil >= 0 && daysUntil <= daysThreshold;
    }

    private BigDecimal applyModifier(BigDecimal base, BigDecimal modifier, String type) {
        if ("PERCENTAGE".equals(type)) {
            return base.add(base.multiply(modifier).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        } else {
            return base.add(modifier);
        }
    }

    private void applyPromoCode(String code, BigDecimal basePrice, int totalPeople,
                                 List<AppliedRule> appliedRules) {
        promoCodeRepository.findByCode(code.toUpperCase()).ifPresent(promo -> {
            if (promo.getCurrentUses() >= promo.getMaxUses()) {
                log.info("Promo code {} has reached max uses", code);
                return;
            }
            LocalDateTime now = LocalDateTime.now();
            if (promo.getValidFrom() != null && now.isBefore(promo.getValidFrom())) return;
            if (promo.getValidUntil() != null && now.isAfter(promo.getValidUntil())) return;

            PricingRule rule = promo.getRule();
            if (rule == null || !rule.getIsActive()) return;

            BigDecimal adjustment;
            if ("PERCENTAGE".equals(rule.getModifierType())) {
                adjustment = basePrice.multiply(rule.getModifierValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(totalPeople));
            } else {
                adjustment = rule.getModifierValue().multiply(BigDecimal.valueOf(totalPeople));
            }

            appliedRules.add(AppliedRule.builder()
                    .ruleName("Promo: " + code.toUpperCase())
                    .type("PROMO")
                    .modifierType(rule.getModifierType())
                    .modifierValue(rule.getModifierValue())
                    .adjustedAmount(adjustment)
                    .build());
        });
    }
}
