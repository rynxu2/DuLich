-- =============================================
-- Tour Database Schema (Updated)
-- Database: tour_db
-- =============================================
-- Uses JSONB for flexible itinerary templates.
-- Supports categories, gallery images, and reviews.

-- ─────────────────────────────────────────────
-- TOURS — Main tour catalog
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tours (
    id                BIGSERIAL PRIMARY KEY,
    title             VARCHAR(255)  NOT NULL,
    description       TEXT,
    location          VARCHAR(255)  NOT NULL,
    category          VARCHAR(50)   NOT NULL DEFAULT 'adventure',
    price             DECIMAL(12,2) NOT NULL,
    original_price    DECIMAL(12,2),                      -- show crossed-out price
    duration          INTEGER       NOT NULL,              -- days
    max_participants  INTEGER       DEFAULT 30,
    rating            DECIMAL(2,1)  DEFAULT 0.0,
    review_count      INTEGER       DEFAULT 0,
    itinerary         JSONB,
    image_url         VARCHAR(500),
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    deleted_at        TIMESTAMP,                           -- soft delete
    search_vector     tsvector,                            -- full-text search
    created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_tours_itinerary ON tours USING GIN (itinerary);

-- B-tree indexes for filters & sorting
CREATE INDEX IF NOT EXISTS idx_tours_location  ON tours(location);
CREATE INDEX IF NOT EXISTS idx_tours_category  ON tours(category);
CREATE INDEX IF NOT EXISTS idx_tours_price     ON tours(price);
CREATE INDEX IF NOT EXISTS idx_tours_rating    ON tours(rating DESC);
CREATE INDEX IF NOT EXISTS idx_tours_active    ON tours(is_active);
CREATE INDEX IF NOT EXISTS idx_tours_deleted   ON tours(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_tours_search ON tours USING GIN (search_vector);

-- Auto-update search_vector on INSERT/UPDATE
CREATE OR REPLACE FUNCTION tours_search_trigger() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tours_search_update ON tours;
CREATE TRIGGER tours_search_update
  BEFORE INSERT OR UPDATE ON tours
  FOR EACH ROW EXECUTE FUNCTION tours_search_trigger();

-- ─────────────────────────────────────────────
-- TOUR_IMAGES — Gallery images per tour
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_images (
    id              BIGSERIAL PRIMARY KEY,
    tour_id         BIGINT       NOT NULL,
    image_url       VARCHAR(500) NOT NULL,
    caption         VARCHAR(255),
    display_order   INTEGER      DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tour_images_tour_id ON tour_images(tour_id);

-- ─────────────────────────────────────────────
-- TOUR_DEPARTURES — Scheduled departure dates
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_departures (
    id              BIGSERIAL PRIMARY KEY,
    tour_id         BIGINT    NOT NULL,
    departure_date  DATE      NOT NULL,
    available_slots INTEGER   NOT NULL DEFAULT 30,
    price_modifier  DECIMAL(5,2) DEFAULT 1.00,       -- 1.0 = normal, 1.2 = +20%
    status          VARCHAR(20)  DEFAULT 'OPEN',      -- OPEN, FULL, CANCELLED
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_departures_tour_id ON tour_departures(tour_id);
CREATE INDEX IF NOT EXISTS idx_departures_date    ON tour_departures(departure_date);

-- ─────────────────────────────────────────────
-- Seed Data
-- ─────────────────────────────────────────────
INSERT INTO tours (title, description, location, category, price, duration, max_participants, rating, review_count, itinerary, image_url) VALUES
(
    'Khám Phá Đà Nẵng - Hội An',
    'Tour du lịch Đà Nẵng - Hội An 3 ngày 2 đêm, tham quan các địa điểm nổi tiếng.',
    'Đà Nẵng', 'beach', 3500000.00, 3, 25, 4.8, 12,
    '{"days": [
        {"day": 1, "activities": ["Đón tại sân bay Đà Nẵng", "Nhận phòng khách sạn", "Tham quan cầu Rồng"]},
        {"day": 2, "activities": ["Bà Nà Hills", "Cầu Vàng", "Fantasy Park"]},
        {"day": 3, "activities": ["Phố cổ Hội An", "Chùa Cầu", "Tiễn sân bay"]}
    ]}',
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800'
),
(
    'Vịnh Hạ Long - Kỳ Quan Thiên Nhiên',
    'Trải nghiệm du thuyền 2 ngày 1 đêm trên vịnh Hạ Long.',
    'Quảng Ninh', 'nature', 4200000.00, 2, 20, 4.9, 18,
    '{"days": [
        {"day": 1, "activities": ["Khởi hành từ Hà Nội", "Lên du thuyền", "Thăm hang Sửng Sốt", "Chèo kayak"]},
        {"day": 2, "activities": ["Tập Tai Chi buổi sáng", "Thăm làng chài", "Về Hà Nội"]}
    ]}',
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800'
),
(
    'Phú Quốc - Đảo Ngọc',
    'Tour Phú Quốc 4 ngày 3 đêm, biển xanh cát trắng và ẩm thực hải sản.',
    'Phú Quốc', 'beach', 5800000.00, 4, 20, 4.7, 9,
    '{"days": [
        {"day": 1, "activities": ["Bay đến Phú Quốc", "Nhận phòng resort", "Tắm biển Sao"]},
        {"day": 2, "activities": ["Lặn ngắm san hô", "Câu cá", "BBQ hải sản"]},
        {"day": 3, "activities": ["VinWonders", "Safari", "Grand World"]},
        {"day": 4, "activities": ["Chợ đêm Phú Quốc", "Mua đặc sản", "Bay về"]}
    ]}',
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800'
),
(
    'Sapa - Ruộng Bậc Thang',
    'Trekking Sapa 3 ngày, ngắm ruộng bậc thang và văn hóa dân tộc.',
    'Lào Cai', 'mountain', 2800000.00, 3, 15, 4.6, 7,
    '{"days": [
        {"day": 1, "activities": ["Xe khách đến Sapa", "Nhận phòng homestay", "Chợ tình Sapa"]},
        {"day": 2, "activities": ["Trekking bản Cát Cát", "Thác Bạc", "Ruộng bậc thang Mường Hoa"]},
        {"day": 3, "activities": ["Đỉnh Fansipan", "Về Hà Nội"]}
    ]}',
    'https://images.unsplash.com/photo-1570366583862-f91883984fde?w=800'
),
(
    'Đà Lạt - Thành Phố Ngàn Hoa',
    'Tour Đà Lạt 3 ngày 2 đêm, khám phá thành phố mộng mơ.',
    'Đà Lạt', 'mountain', 3200000.00, 3, 25, 4.5, 11,
    '{"days": [
        {"day": 1, "activities": ["Bay đến Đà Lạt", "Hồ Xuân Hương", "Chợ đêm Đà Lạt"]},
        {"day": 2, "activities": ["Đồi chè Cầu Đất", "Thác Datanla", "Làng hoa Vạn Thành"]},
        {"day": 3, "activities": ["Thiền viện Trúc Lâm", "QUE Garden", "Bay về"]}
    ]}',
    'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800'
);
