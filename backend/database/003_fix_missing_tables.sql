-- ============================================================
-- MIGRATION 003: Fix Missing Tables & Columns
-- ============================================================
-- Safe to run on an EXISTING database — uses IF NOT EXISTS
-- and ADD COLUMN IF NOT EXISTS throughout.
--
-- Fixes:
--   1. tour_db:    Add promo_usages table
--   2. booking_db: Add promo_code, discount_amount, original_price
--                  columns to bookings; add missing indexes
--   3. platform_db: Add device_tokens table; add missing index
-- ============================================================


-- ************************************************************
--  DATABASE: tour_db — Add promo_usages table
-- ************************************************************
\connect tour_db;

CREATE TABLE IF NOT EXISTS promo_usages (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    promo_code      VARCHAR(50)     NOT NULL,
    booking_id      BIGINT,
    used_at         TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_promo_usages_user_code UNIQUE (user_id, promo_code)
);

CREATE INDEX IF NOT EXISTS idx_promo_usages_user_id    ON promo_usages (user_id);
CREATE INDEX IF NOT EXISTS idx_promo_usages_promo_code ON promo_usages (promo_code);


-- ************************************************************
--  DATABASE: booking_db — Add missing columns + indexes
-- ************************************************************
\connect booking_db;

-- Add missing columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS promo_code      VARCHAR(50);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS original_price  NUMERIC(12,2);

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_booking_created_at  ON bookings (created_at);
CREATE INDEX IF NOT EXISTS idx_payment_provider_tx ON payments (provider_transaction_id);


-- ************************************************************
--  DATABASE: platform_db — Add device_tokens table + index
-- ************************************************************
\connect platform_db;

-- Add missing index on notifications
CREATE INDEX IF NOT EXISTS idx_notif_created_at ON notifications (created_at);

-- Add device_tokens table
CREATE TABLE IF NOT EXISTS device_tokens (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    token           VARCHAR(512)    NOT NULL UNIQUE,
    platform        VARCHAR(10)     NOT NULL DEFAULT 'ANDROID',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_device_token_user ON device_tokens (user_id);
