-- =============================================
-- Review Database Schema
-- Database: review_db
-- =============================================
-- Separated from booking_db. Owns all review/rating data.

CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    tour_id         BIGINT       NOT NULL,
    booking_id      BIGINT,
    rating          DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    title           VARCHAR(255),
    comment         TEXT,
    is_anonymous    BOOLEAN      DEFAULT FALSE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
    -- PUBLISHED, HIDDEN, FLAGGED
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_tour_id    ON reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating     ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created    ON reviews(created_at DESC);
