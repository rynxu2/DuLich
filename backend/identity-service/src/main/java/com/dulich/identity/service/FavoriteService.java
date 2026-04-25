package com.dulich.identity.service;

import com.dulich.identity.entity.Favorite;
import com.dulich.identity.repository.FavoriteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public List<Favorite> getUserFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUserFavoriteCount(Long userId) {
        return favoriteRepository.countByUserId(userId);
    }

    public Favorite addFavorite(Long userId, Long tourId) {
        if (favoriteRepository.existsByUserIdAndTourId(userId, tourId)) {
            return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(f -> f.getTourId().equals(tourId)).findFirst()
                .orElseThrow();
        }
        Favorite fav = Favorite.builder()
            .userId(userId)
            .tourId(tourId)
            .build();
        return favoriteRepository.save(fav);
    }

    @Transactional
    public void removeFavorite(Long userId, Long tourId) {
        favoriteRepository.deleteByUserIdAndTourId(userId, tourId);
    }

    @Transactional
    public Map<String, Object> toggleFavorite(Long userId, Long tourId) {
        if (favoriteRepository.existsByUserIdAndTourId(userId, tourId)) {
            favoriteRepository.deleteByUserIdAndTourId(userId, tourId);
            return Map.of("favorited", false, "tourId", tourId);
        } else {
            Favorite fav = Favorite.builder()
                .userId(userId)
                .tourId(tourId)
                .build();
            favoriteRepository.save(fav);
            return Map.of("favorited", true, "tourId", tourId);
        }
    }

    public Map<String, Object> checkFavorite(Long userId, Long tourId) {
        boolean exists = favoriteRepository.existsByUserIdAndTourId(userId, tourId);
        return Map.of("favorited", exists);
    }
}
