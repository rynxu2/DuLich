-- ═══════════════════════════════════════
-- Analytics Service Database Schema (CQRS)
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS revenue_records (
    id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT NOT NULL,
    tour_id BIGINT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    payment_method VARCHAR(30),
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cost_records (
    id BIGSERIAL PRIMARY KEY,
    expense_id BIGINT NOT NULL,
    tour_id BIGINT NOT NULL,
    category VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    recorded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profit_projections (
    id BIGSERIAL PRIMARY KEY,
    tour_id BIGINT NOT NULL UNIQUE,
    total_revenue DECIMAL(14,2) DEFAULT 0,
    total_cost DECIMAL(14,2) DEFAULT 0,
    profit DECIMAL(14,2) DEFAULT 0,
    margin_percent DECIMAL(5,2) DEFAULT 0,
    total_bookings INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_records_tour_id ON revenue_records(tour_id);
CREATE INDEX idx_cost_records_tour_id ON cost_records(tour_id);
CREATE INDEX idx_profit_projections_tour_id ON profit_projections(tour_id);
