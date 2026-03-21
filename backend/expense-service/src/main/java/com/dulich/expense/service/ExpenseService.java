package com.dulich.expense.service;

import com.dulich.expense.config.RabbitMQConfig;
import com.dulich.expense.dto.ExpenseRequest;
import com.dulich.expense.entity.*;
import com.dulich.expense.event.ExpenseEvent;
import com.dulich.expense.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public Expense createExpense(Long userId, ExpenseRequest request) {
        Expense expense = Expense.builder()
                .tourId(request.getTourId())
                .bookingId(request.getBookingId())
                .guideId(request.getGuideId())
                .itineraryDay(request.getItineraryDay())
                .category(request.getCategory())
                .amount(request.getAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "VND")
                .description(request.getDescription())
                .status("PENDING")
                .createdBy(userId)
                .build();

        expense = expenseRepository.save(expense);
        publishEvent(expense, "CREATED");
        log.info("Expense created: id={}, tourId={}, amount={}", expense.getId(), expense.getTourId(), expense.getAmount());
        return expense;
    }

    public List<Expense> getByTourId(Long tourId) {
        return expenseRepository.findByTourIdOrderByCreatedAtDesc(tourId);
    }

    public List<Expense> getByGuideId(Long guideId) {
        return expenseRepository.findByGuideIdOrderByCreatedAtDesc(guideId);
    }

    public List<Expense> getPending() {
        return expenseRepository.findByStatusOrderByCreatedAtDesc("PENDING");
    }

    public Expense getById(Long id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Expense not found: " + id));
    }

    @Transactional
    public Expense approve(Long id, Long adminId) {
        Expense expense = getById(id);
        expense.setStatus("APPROVED");
        expense.setApprovedBy(adminId);
        expense.setApprovedAt(LocalDateTime.now());
        expense.setUpdatedAt(LocalDateTime.now());
        expense = expenseRepository.save(expense);

        publishEvent(expense, "APPROVED");
        log.info("Expense approved: id={}, by adminId={}", id, adminId);
        return expense;
    }

    @Transactional
    public Expense reject(Long id, Long adminId) {
        Expense expense = getById(id);
        expense.setStatus("REJECTED");
        expense.setApprovedBy(adminId);
        expense.setApprovedAt(LocalDateTime.now());
        expense.setUpdatedAt(LocalDateTime.now());
        expense = expenseRepository.save(expense);

        publishEvent(expense, "REJECTED");
        log.info("Expense rejected: id={}, by adminId={}", id, adminId);
        return expense;
    }

    @Transactional
    public Expense update(Long id, ExpenseRequest request) {
        Expense expense = getById(id);
        if (!"PENDING".equals(expense.getStatus())) {
            throw new RuntimeException("Cannot update approved/rejected expense");
        }
        expense.setCategory(request.getCategory());
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
        expense.setItineraryDay(request.getItineraryDay());
        expense.setUpdatedAt(LocalDateTime.now());
        return expenseRepository.save(expense);
    }

    @Transactional
    public void delete(Long id) {
        Expense expense = getById(id);
        if (!"PENDING".equals(expense.getStatus())) {
            throw new RuntimeException("Cannot delete approved/rejected expense");
        }
        expenseRepository.delete(expense);
    }

    private void publishEvent(Expense expense, String eventType) {
        try {
            ExpenseEvent event = ExpenseEvent.builder()
                    .expenseId(expense.getId())
                    .tourId(expense.getTourId())
                    .bookingId(expense.getBookingId())
                    .guideId(expense.getGuideId())
                    .category(expense.getCategory().name())
                    .amount(expense.getAmount())
                    .currency(expense.getCurrency())
                    .status(expense.getStatus())
                    .eventType(eventType)
                    .build();

            String routingKey = "APPROVED".equals(eventType) ? "expense.approved" : "expense.created";
            rabbitTemplate.convertAndSend(RabbitMQConfig.EXPENSE_EXCHANGE, routingKey, event);
            log.info("Published expense event: {} for expense {}", eventType, expense.getId());
        } catch (Exception e) {
            log.error("Failed to publish expense event: {}", e.getMessage());
        }
    }
}
