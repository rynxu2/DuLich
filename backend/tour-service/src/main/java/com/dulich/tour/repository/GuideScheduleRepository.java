package com.dulich.tour.repository;

import com.dulich.tour.entity.GuideSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface GuideScheduleRepository extends JpaRepository<GuideSchedule, Long> {
    List<GuideSchedule> findByGuideUserIdOrderByStartDateDesc(Long guideUserId);
    List<GuideSchedule> findByTourIdOrderByStartDateDesc(Long tourId);
    List<GuideSchedule> findAllByOrderByCreatedAtDesc();
    List<GuideSchedule> findByGuideUserIdAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
        Long guideUserId, LocalDate endDate, LocalDate startDate
    );
}
