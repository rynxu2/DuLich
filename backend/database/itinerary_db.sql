-- =============================================
-- Itinerary Database Schema (Updated)
-- Database: itinerary_db
-- =============================================
-- Stores PERSONALIZED itinerary per booking.
-- Note: tours.itinerary (JSONB) = template/default schedule.
--       This table = customized schedule after booking.
-- This separation allows users to modify their own
-- itinerary without affecting the tour template.

-- ─────────────────────────────────────────────
-- ITINERARIES — Per-booking travel schedule
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itineraries (
    id              BIGSERIAL PRIMARY KEY,
    booking_id      BIGINT       NOT NULL,
    day_number      INTEGER      NOT NULL,
    activity_title  VARCHAR(255) NOT NULL,
    description     TEXT,
    start_time      TIME,
    end_time        TIME,
    location        VARCHAR(255),
    status          VARCHAR(20)  DEFAULT 'PLANNED',     -- PLANNED, COMPLETED, SKIPPED
    notes           TEXT,                                -- personal notes
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_itineraries_booking_id ON itineraries(booking_id);
CREATE INDEX IF NOT EXISTS idx_itineraries_day        ON itineraries(booking_id, day_number);
