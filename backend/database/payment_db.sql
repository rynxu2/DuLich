-- =============================================
-- Payment Database Schema
-- Database: payment_db
-- =============================================
-- Manages payment processing and transaction logs.

CREATE TABLE IF NOT EXISTS payments (
    id               BIGSERIAL PRIMARY KEY,
    booking_id       BIGINT       NOT NULL,
    user_id          BIGINT       NOT NULL,
    amount           DECIMAL(12,2) NOT NULL,
    currency         VARCHAR(3)   NOT NULL DEFAULT 'VND',
    payment_method   VARCHAR(30)  NOT NULL,
    -- VNPAY, MOMO, ZALOPAY, STRIPE, CASH
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    -- PENDING → PROCESSING → SUCCESS → FAILED → REFUNDED
    provider_transaction_id VARCHAR(255),
    provider_response       JSONB,
    paid_at          TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transactions (
    id               BIGSERIAL PRIMARY KEY,
    payment_id       BIGINT       NOT NULL REFERENCES payments(id),
    type             VARCHAR(20)  NOT NULL,
    -- CHARGE, REFUND, PARTIAL_REFUND
    amount           DECIMAL(12,2) NOT NULL,
    status           VARCHAR(20)  NOT NULL,
    provider_data    JSONB,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refunds (
    id               BIGSERIAL PRIMARY KEY,
    payment_id       BIGINT       NOT NULL REFERENCES payments(id),
    amount           DECIMAL(12,2) NOT NULL,
    reason           TEXT,
    status           VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    -- PENDING → APPROVED → PROCESSED → REJECTED
    processed_at     TIMESTAMP,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking   ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_user      ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status    ON payments(status);
CREATE INDEX IF NOT EXISTS idx_transactions_payment ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment    ON refunds(payment_id);
