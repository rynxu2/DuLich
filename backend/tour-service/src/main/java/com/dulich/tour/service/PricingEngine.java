package com.dulich.tour.service;

import com.dulich.tour.dto.PricePreviewRequest;
import com.dulich.tour.dto.PricePreviewResponse;
import com.dulich.tour.dto.PricePreviewResponse.AppliedRule;
import com.dulich.tour.dto.PromoValidationResponse;
import com.dulich.tour.entity.PricingRule;
import com.dulich.tour.entity.PromoUsage;
import com.dulich.tour.entity.Tour;
import com.dulich.tour.repository.PricingRuleRepository;
import com.dulich.tour.repository.PromoCodeRepository;
import com.dulich.tour.repository.PromoUsageRepository;
import com.dulich.tour.repository.TourRepository;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingEngine {

    private final PricingRuleRepository ruleRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final PromoUsageRepository promoUsageRepository;
    private final TourRepository tourRepository;

    public PricePreviewResponse preview(PricePreviewRequest request) {
        Tour tour = tourRepository.findById(request.getTourId())
            .orElseThrow(() -> new RuntimeException("Tour not found: " + request.getTourId()));

        BigDecimal basePrice = tour.getPrice();
        int totalPeople = request.getAdults() + request.getChildren();

        // Child pricing (70% of adult price)
        BigDecimal adultPrice = basePrice;
        BigDecimal childPrice = basePrice.multiply(BigDecimal.valueOf(0.7))
            .setScale(0, RoundingMode.HALF_UP);

        BigDecimal subtotal = adultPrice.multiply(BigDecimal.valueOf(request.getAdults()))
            .add(childPrice.multiply(BigDecimal.valueOf(request.getChildren())));

        List<AppliedRule> appliedRules = new ArrayList<>();

        // Load and apply pricing rules
        List<PricingRule> rules = loadApplicableRules(request.getTourId());
        for (PricingRule rule : rules) {
            if (!isRuleValid(rule)) continue;

            boolean applies = switch (rule.getType()) {
                case "SEASONAL" -> evaluateSeasonal(rule.getConditions(), request.getDepartureDate());
                case "GROUP" -> evaluateGroup(rule.getConditions(), totalPeople);
                case "EARLYBIRD" -> evaluateEarlyBird(rule.getConditions(), request.getDepartureDate());
                case "LASTMINUTE" -> evaluateLastMinute(rule.getConditions(), request.getDepartureDate());
                default -> false;
            };

            if (applies) {
                BigDecimal adjustment;
                if ("PERCENTAGE".equals(rule.getModifierType())) {
                    adjustment = subtotal.multiply(rule.getModifierValue())
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                } else {
                    adjustment = rule.getModifierValue().multiply(BigDecimal.valueOf(totalPeople));
                }
                appliedRules.add(AppliedRule.builder()
                    .ruleName(rule.getName())
                    .type(rule.getType())
                    .modifierType(rule.getModifierType())
                    .modifierValue(rule.getModifierValue())
                    .adjustedAmount(adjustment)
                    .build());
            }
        }

        // Apply promo code
        if (request.getPromoCode() != null && !request.getPromoCode().isBlank()) {
            applyPromoCode(request.getPromoCode(), basePrice, totalPeople, appliedRules);
        }

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

        List<PricingRule> merged = new ArrayList<>(tourRules);
        Set<String> tourRuleTypes = tourRules.stream().map(PricingRule::getType).collect(Collectors.toSet());
        for (PricingRule gr : globalRules) {
            if (!tourRuleTypes.contains(gr.getType())) merged.add(gr);
        }
        return merged;
    }

    private boolean isRuleValid(PricingRule rule) {
        LocalDateTime now = LocalDateTime.now();
        if (rule.getValidFrom() != null && now.isBefore(rule.getValidFrom())) return false;
        if (rule.getValidUntil() != null && now.isAfter(rule.getValidUntil())) return false;
        return true;
    }

    private boolean evaluateSeasonal(Map<String, Object> cond, LocalDate dep) {
        if (dep == null || cond == null) return false;
        String s = (String) cond.get("seasonStart");
        String e = (String) cond.get("seasonEnd");
        if (s == null || e == null) return false;
        MonthDay start = MonthDay.parse("--" + s);
        MonthDay end = MonthDay.parse("--" + e);
        MonthDay d = MonthDay.from(dep);
        return start.isBefore(end) ? !d.isBefore(start) && !d.isAfter(end)
            : !d.isBefore(start) || !d.isAfter(end);
    }

    private boolean evaluateGroup(Map<String, Object> cond, int total) {
        Object min = cond.get("minGroup");
        int minGroup = min instanceof Number ? ((Number) min).intValue() : 5;
        return total >= minGroup;
    }

    private boolean evaluateEarlyBird(Map<String, Object> cond, LocalDate dep) {
        if (dep == null) return false;
        Object d = cond.get("daysBeforeDeparture");
        int days = d instanceof Number ? ((Number) d).intValue() : 30;
        return ChronoUnit.DAYS.between(LocalDate.now(), dep) >= days;
    }

    private boolean evaluateLastMinute(Map<String, Object> cond, LocalDate dep) {
        if (dep == null) return false;
        Object d = cond.get("daysBeforeDeparture");
        int thresh = d instanceof Number ? ((Number) d).intValue() : 3;
        long until = ChronoUnit.DAYS.between(LocalDate.now(), dep);
        return until >= 0 && until <= thresh;
    }

    private BigDecimal applyModifier(BigDecimal base, BigDecimal modifier, String type) {
        if ("PERCENTAGE".equals(type)) {
            return base.add(base.multiply(modifier).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP));
        }
        return base.add(modifier);
    }

    private void applyPromoCode(String code, BigDecimal basePrice, int totalPeople, List<AppliedRule> rules) {
        promoCodeRepository.findByCode(code.toUpperCase()).ifPresent(promo -> {
            if (promo.getCurrentUses() >= promo.getMaxUses()) return;
            LocalDateTime now = LocalDateTime.now();
            if (promo.getValidFrom() != null && now.isBefore(promo.getValidFrom())) return;
            if (promo.getValidUntil() != null && now.isAfter(promo.getValidUntil())) return;

            PricingRule rule = promo.getRule();
            if (rule == null || !rule.getIsActive()) return;

            BigDecimal adj;
            if ("PERCENTAGE".equals(rule.getModifierType())) {
                adj = basePrice.multiply(rule.getModifierValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(totalPeople));
            } else {
                adj = rule.getModifierValue().multiply(BigDecimal.valueOf(totalPeople));
            }
            rules.add(AppliedRule.builder()
                .ruleName("Promo: " + code.toUpperCase())
                .type("PROMO")
                .modifierType(rule.getModifierType())
                .modifierValue(rule.getModifierValue())
                .adjustedAmount(adj)
                .build());
        });
    }

    /**
     * Validate promo code without side effects.
     */
    public PromoValidationResponse validatePromoCode(String code, Long userId) {
        var opt = promoCodeRepository.findByCode(code.toUpperCase());
        if (opt.isEmpty()) {
            return PromoValidationResponse.builder().valid(false).code(code).message("Mã giảm giá không tồn tại").build();
        }
        var promo = opt.get();
        if (!promo.getIsActive()) {
            return PromoValidationResponse.builder().valid(false).code(code).message("Mã giảm giá đã bị vô hiệu hóa").build();
        }
        if (promo.getCurrentUses() >= promo.getMaxUses()) {
            return PromoValidationResponse.builder().valid(false).code(code).message("Mã giảm giá đã hết lượt sử dụng").build();
        }
        LocalDateTime now = LocalDateTime.now();
        if (promo.getValidFrom() != null && now.isBefore(promo.getValidFrom())) {
            return PromoValidationResponse.builder().valid(false).code(code).message("Mã giảm giá chưa có hiệu lực").build();
        }
        if (promo.getValidUntil() != null && now.isAfter(promo.getValidUntil())) {
            return PromoValidationResponse.builder().valid(false).code(code).message("Mã giảm giá đã hết hạn").build();
        }
        if (userId != null && promoUsageRepository.existsByUserIdAndPromoCode(userId, code.toUpperCase())) {
            return PromoValidationResponse.builder().valid(false).code(code).message("Bạn đã sử dụng mã này rồi").build();
        }
        PricingRule rule = promo.getRule();
        Double discountValue = rule != null ? rule.getModifierValue().abs().doubleValue() : null;
        String discountType = rule != null ? rule.getModifierType() : null;
        return PromoValidationResponse.builder()
            .valid(true).code(code.toUpperCase())
            .description(promo.getDescription())
            .message("Mã giảm giá hợp lệ!")
            .discountValue(discountValue)
            .discountType(discountType)
            .discountPercent("PERCENTAGE".equals(discountType) ? discountValue : null)
            .build();
    }

    /**
     * Consume promo code: increment currentUses + track per-user usage.
     */
    @org.springframework.transaction.annotation.Transactional
    public boolean consumePromoCode(String code, Long userId, Long bookingId) {
        var opt = promoCodeRepository.findByCode(code.toUpperCase());
        if (opt.isEmpty()) return false;
        var promo = opt.get();
        if (promo.getCurrentUses() >= promo.getMaxUses()) return false;
        if (userId != null && promoUsageRepository.existsByUserIdAndPromoCode(userId, code.toUpperCase())) return false;
        promo.setCurrentUses(promo.getCurrentUses() + 1);
        promoCodeRepository.save(promo);
        if (userId != null) {
            promoUsageRepository.save(PromoUsage.builder()
                .userId(userId).promoCode(code.toUpperCase()).bookingId(bookingId).build());
        }
        log.info("Promo {} consumed by userId={}, bookingId={}, currentUses={}/{}",
            code, userId, bookingId, promo.getCurrentUses(), promo.getMaxUses());
        return true;
    }
}
