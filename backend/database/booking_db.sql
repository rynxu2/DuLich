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
    deleted_at       TIMESTAMP,                          -- soft delete
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id        ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id        ON bookings(tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_departure_id   ON bookings(departure_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status         ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created        ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_active         ON bookings(deleted_at) WHERE deleted_at IS NULL;

-- ─────────────────────────────────────────────
-- BOOKING_TRAVELERS — Detailed per-traveler info
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS booking_travelers (
    id              BIGSERIAL PRIMARY KEY,
    booking_id      BIGINT       NOT NULL,
    full_name       VARCHAR(100) NOT NULL,
    date_of_birth   DATE,
    id_number       VARCHAR(30),                         -- CMND/CCCD/Passport
    type            VARCHAR(10)  NOT NULL DEFAULT 'ADULT',
                    -- ADULT, CHILD, INFANT
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_booking_travelers_booking ON booking_travelers(booking_id);

-- Reviews have been moved to review_db (owned by review-service).
-- booking_db no longer manages review data.


