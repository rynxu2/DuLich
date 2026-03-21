-- ═══════════════════════════════════════
-- Pricing Service Database Schema
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS pricing_rules (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL,
    conditions JSONB NOT NULL DEFAULT '{}',
    modifier_type VARCHAR(10) NOT NULL DEFAULT 'PERCENTAGE',
    modifier_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    tour_id BIGINT,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS promo_codes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    rule_id BIGINT REFERENCES pricing_rules(id) ON DELETE CASCADE,
    max_uses INT DEFAULT 100,
    current_uses INT DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pricing_rules_type ON pricing_rules(type);
CREATE INDEX idx_pricing_rules_tour_id ON pricing_rules(tour_id);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
