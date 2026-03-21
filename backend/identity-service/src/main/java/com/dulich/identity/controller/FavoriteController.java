package com.dulich.identity.controller;

import com.dulich.identity.entity.Favorite;
import com.dulich.identity.service.FavoriteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ResponseEntity<List<Favorite>> getMyFavorites(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(userId));
    }

    @PostMapping("/toggle/{tourId}")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long tourId) {
        return ResponseEntity.ok(favoriteService.toggleFavorite(userId, tourId));
    }

    @GetMapping("/check/{tourId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long tourId) {
        return ResponseEntity.ok(favoriteService.checkFavorite(userId, tourId));
    }
}
