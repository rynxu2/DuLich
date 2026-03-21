-- =============================================
-- Notification Database Schema (NEW)
-- Database: notification_db
-- =============================================
-- Push notifications, booking alerts, promotions.

-- ─────────────────────────────────────────────
-- NOTIFICATIONS — User notifications
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              BIGSERIAL PRIMARY KEY,
    user_id         BIGINT       NOT NULL,
    title           VARCHAR(255) NOT NULL,
    message         TEXT         NOT NULL,
    type            VARCHAR(30)  NOT NULL DEFAULT 'SYSTEM',
                    -- BOOKING_CONFIRMED, BOOKING_CANCELLED, PAYMENT_SUCCESS,
                    -- DEPARTURE_REMINDER, PROMO, REVIEW_REPLY, SYSTEM
    reference_type  VARCHAR(30),                         -- BOOKING, TOUR, REVIEW
    reference_id    BIGINT,                              -- ID of related entity
    is_read         BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read     ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created  ON notifications(created_at DESC);
