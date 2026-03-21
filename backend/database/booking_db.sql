-- =============================================
-- Booking Database Schema (Updated)
-- Database: booking_db
-- =============================================
-- Manages bookings, payments, and customer reviews.

-- ─────────────────────────────────────────────
-- BOOKINGS — Tour reservations
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
    id               BIGSERIAL PRIMARY KEY,
    user_id          BIGINT       NOT NULL,
    tour_id          BIGINT       NOT NULL,
    departure_id     BIGINT,                            -- ref to tour_departures
    booking_date     DATE         NOT NULL DEFAULT CURRENT_DATE,
    travelers        INTEGER      NOT NULL DEFAULT 1,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                     -- PENDING → CONFIRMED → COMPLETED / CANCELLED
    total_price      DECIMAL(12,2) NOT NULL,
    contact_name     VARCHAR(100),
    contact_phone    VARCHAR(20),
    special_requests TEXT,
    payment_method   VARCHAR(30)  DEFAULT 'CASH',       -- CASH, VNPAY, MOMO, BANK
    payment_status   VARCHAR(20)  NOT NULL DEFAULT 'UNPAID',
                     -- UNPAID → PAID → REFUNDED
    paid_at          TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id        ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id        ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status         ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created        ON bookings(created_at DESC);

-- ─────────────────────────────────────────────
-- REVIEWS — Customer feedback & ratings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    tour_id         BIGINT       NOT NULL,
    booking_id      BIGINT,                              -- optional link to booking
    rating          DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    title           VARCHAR(255),
    comment         TEXT,
    is_anonymous    BOOLEAN      DEFAULT FALSE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PUBLISHED',
                    -- PUBLISHED, HIDDEN, FLAGGED
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tour_id)                             -- 1 review per user per tour
);

CREATE INDEX IF NOT EXISTS idx_reviews_tour_id    ON reviews(tour_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id    ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating     ON reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_created    ON reviews(created_at DESC);
