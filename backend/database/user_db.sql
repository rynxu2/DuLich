-- =============================================
-- User Database Schema
-- Database: user_db
-- =============================================
-- Profile data, favorites. Separated from auth.

CREATE TABLE IF NOT EXISTS user_profiles (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL UNIQUE,
    full_name       VARCHAR(100),
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    date_of_birth   DATE,
    address         TEXT,
    bio             TEXT,
    preferences     JSONB,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorites (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT    NOT NULL,
    tour_id         BIGINT    NOT NULL,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id  ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tour_id ON favorites(tour_id);
