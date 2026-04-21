package com.dulich.booking.service;

import com.dulich.booking.dto.ExpenseRequest;
import com.dulich.booking.entity.Expense;
import com.dulich.booking.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Transactional
    public Expense create(Long userId, ExpenseRequest req) {
        Expense expense = Expense.builder()
            .tourId(req.getTourId())
            .bookingId(req.getBookingId())
            .guideId(req.getGuideId())
            .itineraryDay(req.getItineraryDay())
            .category(req.getCategory())
            .amount(req.getAmount())
            .currency(req.getCurrency() != null ? req.getCurrency() : "VND")
            .description(req.getDescription())
            .status("PENDING")
            .createdBy(userId)
            .build();
        expense = expenseRepository.save(expense);
        log.info("Expense created: id={}, tourId={}, amount={}", expense.getId(), expense.getTourId(), expense.getAmount());
        return expense;
    }

    public List<Expense> getByTourId(Long tourId) { return expenseRepository.findByTourIdOrderByCreatedAtDesc(tourId); }
    public List<Expense> getByGuideId(Long guideId) { return expenseRepository.findByGuideIdOrderByCreatedAtDesc(guideId); }
    public List<Expense> getPending() { return expenseRepository.findByStatusOrderByCreatedAtDesc("PENDING"); }
    public Expense getById(Long id) { return expenseRepository.findById(id).orElseThrow(() -> new RuntimeException("Expense not found: " + id)); }

    @Transactional
    public Expense approve(Long id, Long adminId) {
        Expense e = getById(id);
        e.setStatus("APPROVED"); e.setApprovedBy(adminId); e.setApprovedAt(LocalDateTime.now()); e.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(e);
    }

    @Transactional
    public Expense reject(Long id, Long adminId) {
        Expense e = getById(id);
        e.setStatus("REJECTED"); e.setApprovedBy(adminId); e.setApprovedAt(LocalDateTime.now()); e.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(e);
    }

    @Transactional
    public Expense update(Long id, ExpenseRequest req) {
        Expense e = getById(id);
        if (!"PENDING".equals(e.getStatus())) throw new RuntimeException("Cannot update approved/rejected expense");
        e.setCategory(req.getCategory()); e.setAmount(req.getAmount()); e.setDescription(req.getDescription());
        e.setItineraryDay(req.getItineraryDay()); e.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(e);
    }

    @Transactional
    public void delete(Long id) {
        Expense e = getById(id);
        if (!"PENDING".equals(e.getStatus())) throw new RuntimeException("Cannot delete approved/rejected expense");
        expenseRepository.delete(e);
    }
}
