-- ═══════════════════════════════════════
-- Expense Service Database Schema
-- ═══════════════════════════════════════

CREATE TABLE IF NOT EXISTS expenses (
    id BIGSERIAL PRIMARY KEY,
    tour_id BIGINT NOT NULL,
    booking_id BIGINT,
    guide_id BIGINT,
    itinerary_day INT,
    category VARCHAR(30) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'VND',
    description TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    approved_by BIGINT,
    approved_at TIMESTAMP,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expense_attachments (
    id BIGSERIAL PRIMARY KEY,
    expense_id BIGINT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255),
    file_size BIGINT,
    content_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_tour_id ON expenses(tour_id);
CREATE INDEX idx_expenses_guide_id ON expenses(guide_id);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expense_attachments_expense_id ON expense_attachments(expense_id);
