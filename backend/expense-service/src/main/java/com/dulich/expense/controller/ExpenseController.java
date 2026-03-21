package com.dulich.expense.controller;

import com.dulich.expense.dto.ExpenseRequest;
import com.dulich.expense.entity.Expense;
import com.dulich.expense.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("service", "expense-service", "status", "UP"));
    }

    @PostMapping
    public ResponseEntity<Expense> create(
            @RequestHeader(value = "X-User-Id", defaultValue = "0") Long userId,
            @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.createExpense(userId, request));
    }

    @GetMapping("/tour/{tourId}")
    public ResponseEntity<List<Expense>> getByTour(@PathVariable Long tourId) {
        return ResponseEntity.ok(expenseService.getByTourId(tourId));
    }

    @GetMapping("/guide/{guideId}")
    public ResponseEntity<List<Expense>> getByGuide(@PathVariable Long guideId) {
        return ResponseEntity.ok(expenseService.getByGuideId(guideId));
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Expense>> getPending() {
        return ResponseEntity.ok(expenseService.getPending());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getById(@PathVariable Long id) {
        return ResponseEntity.ok(expenseService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> update(@PathVariable Long id, @Valid @RequestBody ExpenseRequest request) {
        return ResponseEntity.ok(expenseService.update(id, request));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<Expense> approve(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "0") Long adminId) {
        return ResponseEntity.ok(expenseService.approve(id, adminId));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<Expense> reject(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", defaultValue = "0") Long adminId) {
        return ResponseEntity.ok(expenseService.reject(id, adminId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        expenseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
