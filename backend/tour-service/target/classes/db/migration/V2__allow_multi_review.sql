-- Migration: Allow multiple reviews per user per tour
-- Old constraint: UNIQUE(user_id, tour_id) — only 1 review ever
-- New logic: completedBookings > existingReviews (enforced by application layer)

-- Drop the old unique constraint (name may vary, check with \d reviews)
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_tour_id_key;
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS uk_reviews_user_id_tour_id;

-- Verify: no unique constraint on (user_id, tour_id) remains
-- Run: SELECT conname FROM pg_constraint WHERE conrelid = 'reviews'::regclass;
