package com.dulich.tour.controller;

import com.dulich.tour.dto.PricePreviewRequest;
import com.dulich.tour.dto.PricePreviewResponse;
import com.dulich.tour.entity.PricingRule;
import com.dulich.tour.entity.PromoCode;
import com.dulich.tour.repository.PricingRuleRepository;
import com.dulich.tour.repository.PromoCodeRepository;
import com.dulich.tour.service.PricingEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingEngine pricingEngine;
    private final PricingRuleRepository ruleRepository;
    private final PromoCodeRepository promoCodeRepository;

    // ── Price Preview ──
    @GetMapping("/preview")
    public ResponseEntity<PricePreviewResponse> previewGet(PricePreviewRequest request) {
        return ResponseEntity.ok(pricingEngine.preview(request));
    }

    @PostMapping("/preview")
    public ResponseEntity<PricePreviewResponse> previewPost(@RequestBody PricePreviewRequest request) {
        return ResponseEntity.ok(pricingEngine.preview(request));
    }

    // ── Pricing Rules CRUD ──
    @GetMapping("/rules")
    public ResponseEntity<List<PricingRule>> listRules() {
        return ResponseEntity.ok(ruleRepository.findAll());
    }

    @PostMapping("/rules")
    public ResponseEntity<PricingRule> createRule(@RequestBody PricingRule rule) {
        return ResponseEntity.status(201).body(ruleRepository.save(rule));
    }

    @PutMapping("/rules/{id}")
    public ResponseEntity<PricingRule> updateRule(@PathVariable Long id, @RequestBody PricingRule updates) {
        PricingRule rule = ruleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Rule not found: " + id));
        if (updates.getName() != null) rule.setName(updates.getName());
        if (updates.getType() != null) rule.setType(updates.getType());
        if (updates.getConditions() != null) rule.setConditions(updates.getConditions());
        if (updates.getModifierType() != null) rule.setModifierType(updates.getModifierType());
        if (updates.getModifierValue() != null) rule.setModifierValue(updates.getModifierValue());
        if (updates.getPriority() != null) rule.setPriority(updates.getPriority());
        if (updates.getIsActive() != null) rule.setIsActive(updates.getIsActive());
        return ResponseEntity.ok(ruleRepository.save(rule));
    }

    @DeleteMapping("/rules/{id}")
    public ResponseEntity<Void> deleteRule(@PathVariable Long id) {
        ruleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Promo Codes CRUD ──
    @GetMapping("/promos")
    public ResponseEntity<List<PromoCode>> listPromos() {
        return ResponseEntity.ok(promoCodeRepository.findAll());
    }

    @PostMapping("/promos")
    public ResponseEntity<PromoCode> createPromo(@RequestBody PromoCode promo) {
        return ResponseEntity.status(201).body(promoCodeRepository.save(promo));
    }

    @DeleteMapping("/promos/{id}")
    public ResponseEntity<Void> deletePromo(@PathVariable Long id) {
        promoCodeRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
