package com.dulich.identity.repository;

import com.dulich.identity.entity.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Favorite> findByUserIdAndTourId(Long userId, Long tourId);
    boolean existsByUserIdAndTourId(Long userId, Long tourId);
    long countByUserId(Long userId);
    void deleteByUserIdAndTourId(Long userId, Long tourId);
}
