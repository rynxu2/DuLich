package com.dulich.pricing.controller;

import com.dulich.pricing.dto.PricePreviewRequest;
import com.dulich.pricing.dto.PricePreviewResponse;
import com.dulich.pricing.entity.PricingRule;
import com.dulich.pricing.entity.PromoCode;
import com.dulich.pricing.repository.PricingRuleRepository;
import com.dulich.pricing.repository.PromoCodeRepository;
import com.dulich.pricing.service.PricingEngine;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingEngine pricingEngine;
    private final PricingRuleRepository ruleRepository;
    private final PromoCodeRepository promoCodeRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "pricing-service", "status", "UP"));
    }

    /** Preview price for a tour with dynamic pricing rules applied */
    @PostMapping("/preview")
    public ResponseEntity<PricePreviewResponse> previewPrice(@RequestBody PricePreviewRequest request) {
        return ResponseEntity.ok(pricingEngine.calculatePrice(request));
    }

    /** GET variant for easy testing */
    @GetMapping("/preview")
    public ResponseEntity<PricePreviewResponse> previewPriceGet(
            @RequestParam Long tourId,
            @RequestParam(required = false) String departureDate,
            @RequestParam(defaultValue = "1") int adults,
            @RequestParam(defaultValue = "0") int children,
            @RequestParam(required = false) String promoCode) {

        PricePreviewRequest request = new PricePreviewRequest();
        request.setTourId(tourId);
        request.setAdults(adults);
        request.setChildren(children);
        request.setPromoCode(promoCode);
        if (departureDate != null) {
            try {
                request.setDepartureDate(java.time.LocalDate.parse(departureDate));
            } catch (Exception e) {
                throw new RuntimeException("Invalid date format. Use yyyy-MM-dd");
            }
        }
        return ResponseEntity.ok(pricingEngine.calculatePrice(request));
    }

    // ═══════════════════════════════════════
    //  ADMIN — Rule Management
    // ═══════════════════════════════════════

    @GetMapping("/rules")
    public ResponseEntity<List<PricingRule>> getAllRules() {
        return ResponseEntity.ok(ruleRepository.findAll());
    }

    @PostMapping("/rules")
    public ResponseEntity<PricingRule> createRule(@Valid @RequestBody PricingRule rule) {
        return ResponseEntity.ok(ruleRepository.save(rule));
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<PricingRule> updateRule(@PathVariable Long id, @RequestBody PricingRule rule) {
        rule.setId(id);
        return ResponseEntity.ok(ruleRepository.save(rule));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        ruleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════
    //  ADMIN — Promo Code Management
    // ═══════════════════════════════════════

    @GetMapping("/promos")
    public ResponseEntity<List<PromoCode>> getAllPromos() {
        return ResponseEntity.ok(promoCodeRepository.findAll());
    }

    @PostMapping("/promos")
    public ResponseEntity<PromoCode> createPromo(@Valid @RequestBody PromoCode promo) {
        promo.setCode(promo.getCode().toUpperCase());
        return ResponseEntity.ok(promoCodeRepository.save(promo));
    }
}
