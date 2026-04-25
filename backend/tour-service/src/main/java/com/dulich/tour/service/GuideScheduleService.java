package com.dulich.tour.service;

import com.dulich.tour.entity.GuideSchedule;
import com.dulich.tour.repository.GuideScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GuideScheduleService {

    private final GuideScheduleRepository repo;

    public List<GuideSchedule> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    public List<GuideSchedule> getByGuide(Long guideUserId) {
        return repo.findByGuideUserIdOrderByStartDateDesc(guideUserId);
    }

    public List<GuideSchedule> getByTour(Long tourId) {
        return repo.findByTourIdOrderByStartDateDesc(tourId);
    }

    @Transactional
    public GuideSchedule assign(GuideSchedule schedule) {
        // Check schedule conflict
        List<GuideSchedule> conflicts = repo.findByGuideUserIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            schedule.getGuideUserId(), schedule.getEndDate(), schedule.getStartDate()
        );
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Guide đã được phân công tour khác trong khoảng thời gian này");
        }

        schedule.setStatus("ASSIGNED");
        GuideSchedule saved = repo.save(schedule);
        log.info("Guide {} assigned to tour {} ({} → {})",
            schedule.getGuideUserId(), schedule.getTourId(),
            schedule.getStartDate(), schedule.getEndDate());
        return saved;
    }

    @Transactional
    public GuideSchedule updateStatus(Long id, String status) {
        GuideSchedule schedule = repo.findById(id)
            .orElseThrow(() -> new RuntimeException("Schedule not found"));
        schedule.setStatus(status);
        return repo.save(schedule);
    }

    @Transactional
    public void delete(Long id) {
        repo.deleteById(id);
        log.info("Guide schedule {} deleted", id);
    }
}
