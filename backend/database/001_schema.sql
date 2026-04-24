-- ============================================================
-- TRAVEL BOOKING PLATFORM — FULL DATABASE SCHEMA
-- ============================================================
-- PostgreSQL 15+
--
-- Architecture: 4 databases (one per microservice)
--   identity_db  → users, user_profiles, favorites, refresh_tokens
--   tour_db      → tours, tour_images, tour_departures, reviews,
--                   itineraries, pricing_rules, promo_codes, guide_schedules
--   booking_db   → bookings, payments, transactions, expenses, expense_attachments
--   platform_db  → notifications
--
-- Usage:
--   psql -U dulich -f 001_schema.sql
--   Or run per-database sections individually via \connect
-- ============================================================

create database identity_db;
create database tour_db;
create database booking_db;
create database platform_db;

-- ************************************************************
--  DATABASE: identity_db
-- ************************************************************
\connect identity_db;

-- ── users ──
CREATE TABLE IF NOT EXISTS users (
    id              BIGSERIAL       PRIMARY KEY,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    email           VARCHAR(100)    NOT NULL UNIQUE,
    password        VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(100),
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    role            VARCHAR(20)     NOT NULL DEFAULT 'USER',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email    ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_role     ON users (role);

-- ── user_profiles ──
CREATE TABLE IF NOT EXISTS user_profiles (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL UNIQUE,
    full_name       VARCHAR(100),
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),
    date_of_birth   DATE,
    address         TEXT,
    bio             TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles (user_id);

-- ── favorites ──
CREATE TABLE IF NOT EXISTS favorites (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    tour_id         BIGINT          NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_favorites_user_tour UNIQUE (user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites (user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_tour_id ON favorites (tour_id);

-- ── refresh_tokens ──
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    token           VARCHAR(500)    NOT NULL UNIQUE,
    expires_at      TIMESTAMP       NOT NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token   ON refresh_tokens (token);


-- ************************************************************
--  DATABASE: tour_db
-- ************************************************************
\connect tour_db;

-- ── tours ──
CREATE TABLE IF NOT EXISTS tours (
    id                BIGSERIAL        PRIMARY KEY,
    title             VARCHAR(255)     NOT NULL,
    description       TEXT,
    location          VARCHAR(255)     NOT NULL,
    category          VARCHAR(50)      NOT NULL DEFAULT 'adventure',
    price             NUMERIC(12,2)    NOT NULL,
    duration          INTEGER          NOT NULL,
    max_participants  INTEGER          DEFAULT 30,
    rating            NUMERIC(2,1)     DEFAULT 0.0,
    review_count      INTEGER          DEFAULT 0,
    itinerary         JSONB,
    image_url         VARCHAR(500),
    is_active         BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tours_category  ON tours (category);
CREATE INDEX IF NOT EXISTS idx_tours_location  ON tours (location);
CREATE INDEX IF NOT EXISTS idx_tours_is_active ON tours (is_active);
CREATE INDEX IF NOT EXISTS idx_tours_price     ON tours (price);

-- ── tour_images ──
CREATE TABLE IF NOT EXISTS tour_images (
    id              BIGSERIAL       PRIMARY KEY,
    tour_id         BIGINT          NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    image_url       VARCHAR(500)    NOT NULL,
    caption         VARCHAR(255),
    display_order   INTEGER         DEFAULT 0,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_images_tour_id ON tour_images (tour_id);

-- ── tour_departures ──
CREATE TABLE IF NOT EXISTS tour_departures (
    id              BIGSERIAL       PRIMARY KEY,
    tour_id         BIGINT          NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    departure_date  DATE            NOT NULL,
    available_slots INTEGER         NOT NULL DEFAULT 30,
    price_modifier  NUMERIC(5,2)    DEFAULT 1.00,
    status          VARCHAR(20)     DEFAULT 'OPEN',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_departures_tour_id        ON tour_departures (tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_departures_departure_date ON tour_departures (departure_date);
CREATE INDEX IF NOT EXISTS idx_tour_departures_status         ON tour_departures (status);

-- ── reviews ──
CREATE TABLE IF NOT EXISTS reviews (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    tour_id         BIGINT          NOT NULL,
    booking_id      BIGINT,
    rating          NUMERIC(2,1)    NOT NULL,
    title           VARCHAR(255),
    comment         TEXT,
    is_anonymous    BOOLEAN         DEFAULT FALSE,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PUBLISHED',
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_reviews_user_tour UNIQUE (user_id, tour_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_tour_id ON reviews (tour_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status  ON reviews (status);

-- ── itineraries ──
CREATE TABLE IF NOT EXISTS itineraries (
    id              BIGSERIAL       PRIMARY KEY,
    booking_id      BIGINT          NOT NULL,
    day_number      INTEGER         NOT NULL,
    activity_title  VARCHAR(255)    NOT NULL,
    description     TEXT,
    start_time      TIME,
    end_time        TIME,
    location        VARCHAR(255),
    status          VARCHAR(20)     DEFAULT 'PLANNED',
    notes           TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_itineraries_booking_id ON itineraries (booking_id);

-- ── pricing_rules ──
CREATE TABLE IF NOT EXISTS pricing_rules (
    id              BIGSERIAL       PRIMARY KEY,
    name            VARCHAR(255)    NOT NULL,
    type            VARCHAR(20)     NOT NULL,
    conditions      JSONB,
    modifier_type   VARCHAR(20)     NOT NULL,
    modifier_value  NUMERIC(12,2)   NOT NULL,
    priority        INTEGER         NOT NULL,
    is_active       BOOLEAN         DEFAULT TRUE,
    tour_id         BIGINT,
    valid_from      TIMESTAMP,
    valid_until     TIMESTAMP,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_rules_type      ON pricing_rules (type);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_is_active ON pricing_rules (is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_rules_tour_id   ON pricing_rules (tour_id);

-- ── promo_codes ──
CREATE TABLE IF NOT EXISTS promo_codes (
    id              BIGSERIAL       PRIMARY KEY,
    code            VARCHAR(50)     NOT NULL UNIQUE,
    description     TEXT,
    rule_id         BIGINT          REFERENCES pricing_rules(id) ON DELETE SET NULL,
    max_uses        INTEGER         DEFAULT 100,
    current_uses    INTEGER         DEFAULT 0,
    valid_from      TIMESTAMP,
    valid_until     TIMESTAMP,
    is_active       BOOLEAN         DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code      ON promo_codes (code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_is_active ON promo_codes (is_active);

-- ── guide_schedules ──
CREATE TABLE IF NOT EXISTS guide_schedules (
    id              BIGSERIAL       PRIMARY KEY,
    guide_user_id   BIGINT          NOT NULL,
    tour_id         BIGINT,
    booking_id      BIGINT,
    start_date      DATE            NOT NULL,
    end_date        DATE            NOT NULL,
    status          VARCHAR(20)     DEFAULT 'ASSIGNED',
    notes           TEXT,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guide_schedules_guide_user_id ON guide_schedules (guide_user_id);
CREATE INDEX IF NOT EXISTS idx_guide_schedules_tour_id       ON guide_schedules (tour_id);
CREATE INDEX IF NOT EXISTS idx_guide_schedules_dates         ON guide_schedules (start_date, end_date);


-- ************************************************************
--  DATABASE: booking_db
-- ************************************************************
\connect booking_db;

-- ── bookings ──
CREATE TABLE IF NOT EXISTS bookings (
    id              BIGSERIAL        PRIMARY KEY,
    user_id         BIGINT           NOT NULL,
    tour_id         BIGINT           NOT NULL,
    departure_id    BIGINT,
    booking_date    DATE             NOT NULL DEFAULT CURRENT_DATE,
    travelers       INTEGER          NOT NULL DEFAULT 1,
    status          VARCHAR(20)      NOT NULL DEFAULT 'PENDING',
    total_price     NUMERIC(12,2)    NOT NULL,
    contact_name    VARCHAR(100),
    contact_phone   VARCHAR(20),
    special_requests TEXT,
    payment_method  VARCHAR(30)      DEFAULT 'CASH',
    payment_status  VARCHAR(20)      NOT NULL DEFAULT 'UNPAID',
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id      ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_tour_id      ON bookings (tour_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status       ON bookings (status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings (booking_date);

-- ── payments ──
CREATE TABLE IF NOT EXISTS payments (
    id                       BIGSERIAL        PRIMARY KEY,
    booking_id               BIGINT           NOT NULL,
    user_id                  BIGINT           NOT NULL,
    amount                   NUMERIC(12,2)    NOT NULL,
    currency                 VARCHAR(10)      NOT NULL DEFAULT 'VND',
    payment_method           VARCHAR(30)      NOT NULL,
    status                   VARCHAR(20)      NOT NULL DEFAULT 'PENDING',
    provider_transaction_id  VARCHAR(255),
    provider_response        TEXT,
    paid_at                  TIMESTAMP,
    created_at               TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id    ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status     ON payments (status);

-- ── transactions ──
CREATE TABLE IF NOT EXISTS transactions (
    id              BIGSERIAL        PRIMARY KEY,
    payment_id      BIGINT           NOT NULL,
    type            VARCHAR(20)      NOT NULL,
    amount          NUMERIC(12,2)    NOT NULL,
    status          VARCHAR(20)      NOT NULL DEFAULT 'PENDING',
    provider_data   TEXT,
    created_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions (payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type       ON transactions (type);

-- ── expenses ──
CREATE TABLE IF NOT EXISTS expenses (
    id              BIGSERIAL        PRIMARY KEY,
    tour_id         BIGINT,
    booking_id      BIGINT,
    guide_id        BIGINT,
    itinerary_day   INTEGER,
    category        VARCHAR(30)      NOT NULL,
    amount          NUMERIC(12,2)    NOT NULL,
    currency        VARCHAR(10)      NOT NULL DEFAULT 'VND',
    description     TEXT,
    status          VARCHAR(20)      NOT NULL DEFAULT 'PENDING',
    created_by      BIGINT,
    approved_by     BIGINT,
    approved_at     TIMESTAMP,
    created_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_tour_id    ON expenses (tour_id);
CREATE INDEX IF NOT EXISTS idx_expenses_booking_id ON expenses (booking_id);
CREATE INDEX IF NOT EXISTS idx_expenses_guide_id   ON expenses (guide_id);
CREATE INDEX IF NOT EXISTS idx_expenses_status     ON expenses (status);
CREATE INDEX IF NOT EXISTS idx_expenses_category   ON expenses (category);

-- ── expense_attachments ──
CREATE TABLE IF NOT EXISTS expense_attachments (
    id              BIGSERIAL       PRIMARY KEY,
    expense_id      BIGINT          NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    file_name       VARCHAR(255)    NOT NULL,
    file_url        VARCHAR(500)    NOT NULL,
    file_size       BIGINT,
    content_type    VARCHAR(100),
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense_id ON expense_attachments (expense_id);


-- ************************************************************
--  DATABASE: platform_db
-- ************************************************************
\connect platform_db;

-- ── notifications ──
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL       PRIMARY KEY,
    user_id         BIGINT          NOT NULL,
    title           VARCHAR(255)    NOT NULL,
    message         TEXT            NOT NULL,
    type            VARCHAR(30)     NOT NULL DEFAULT 'SYSTEM',
    reference_type  VARCHAR(30),
    reference_id    BIGINT,
    is_read         BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type    ON notifications (type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, is_read);
