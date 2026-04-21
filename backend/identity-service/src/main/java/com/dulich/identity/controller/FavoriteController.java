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

    /** GET /favorites — legacy: get my favorites via X-User-Id header */
    @GetMapping
    public ResponseEntity<List<Favorite>> getMyFavorites(
            @RequestHeader("X-User-Id") Long userId) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(userId));
    }

    /** GET /favorites/user/{userId} — get favorites by userId */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Favorite>> getUserFavorites(@PathVariable Long userId) {
        return ResponseEntity.ok(favoriteService.getUserFavorites(userId));
    }

    /** POST /favorites — add favorite { userId, tourId } */
    @PostMapping
    public ResponseEntity<Favorite> addFavorite(@RequestBody Map<String, Long> body) {
        Long userId = body.get("userId");
        Long tourId = body.get("tourId");
        return ResponseEntity.status(201).body(favoriteService.addFavorite(userId, tourId));
    }

    /** DELETE /favorites/{userId}/{tourId} — remove favorite */
    @DeleteMapping("/{userId}/{tourId}")
    public ResponseEntity<Void> removeFavorite(
            @PathVariable Long userId, @PathVariable Long tourId) {
        favoriteService.removeFavorite(userId, tourId);
        return ResponseEntity.noContent().build();
    }

    /** POST /favorites/toggle/{tourId} — toggle favorite */
    @PostMapping("/toggle/{tourId}")
    public ResponseEntity<Map<String, Object>> toggleFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long tourId) {
        return ResponseEntity.ok(favoriteService.toggleFavorite(userId, tourId));
    }

    /** GET /favorites/check/{tourId} — check if favorited */
    @GetMapping("/check/{tourId}")
    public ResponseEntity<Map<String, Object>> checkFavorite(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long tourId) {
        return ResponseEntity.ok(favoriteService.checkFavorite(userId, tourId));
    }
}
