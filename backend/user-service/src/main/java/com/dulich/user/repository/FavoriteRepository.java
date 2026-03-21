package com.dulich.user.repository;

import com.dulich.user.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Optional<Favorite> findByUserIdAndTourId(Long userId, Long tourId);
    void deleteByUserIdAndTourId(Long userId, Long tourId);
}
