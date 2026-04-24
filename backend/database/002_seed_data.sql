-- ============================================================
-- TRAVEL BOOKING PLATFORM — SAMPLE DATA (SEED)
-- ============================================================
-- PostgreSQL 15+
--
-- Run AFTER 001_schema.sql
-- Usage:
--   psql -U dulich -f 002_seed_data.sql
-- ============================================================


-- ************************************************************
--  DATABASE: identity_db
-- ************************************************************
\connect identity_db;

-- ── users ──
-- Passwords are bcrypt hash of "password123"
INSERT INTO users (id, username, email, password, full_name, phone, avatar_url, role, is_active, created_at, updated_at)
VALUES
    (1, 'admin',       'admin@dulich.vn',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Quản Trị Viên',    '0901000001', NULL, 'ADMIN', TRUE, NOW(), NOW()),
    (2, 'guide_minh',  'minh.guide@dulich.vn',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Nguyễn Văn Minh',  '0901000002', NULL, 'GUIDE', TRUE, NOW(), NOW()),
    (3, 'guide_lan',   'lan.guide@dulich.vn',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Trần Thị Lan',     '0901000003', NULL, 'GUIDE', TRUE, NOW(), NOW()),
    (4, 'user_hoa',    'hoa@gmail.com',         '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Lê Thị Hoa',       '0912345678', NULL, 'USER',  TRUE, NOW(), NOW()),
    (5, 'user_tuan',   'tuan@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Phạm Văn Tuấn',    '0923456789', NULL, 'USER',  TRUE, NOW(), NOW()),
    (6, 'user_mai',    'mai@gmail.com',         '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Đỗ Thị Mai',       '0934567890', NULL, 'USER',  TRUE, NOW(), NOW()),
    (7, 'user_duc',    'duc@gmail.com',         '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Hoàng Văn Đức',    '0945678901', NULL, 'USER',  TRUE, NOW(), NOW()),
    (8, 'user_linh',   'linh@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Vũ Thị Linh',      '0956789012', NULL, 'USER',  TRUE, NOW(), NOW()),
    (9, 'user_nam',    'nam@gmail.com',         '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bùi Văn Nam',      '0967890123', NULL, 'USER',  TRUE, NOW(), NOW()),
    (10,'user_thao',   'thao@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Ngô Thị Thảo',     '0978901234', NULL, 'USER',  TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- ── user_profiles ──
INSERT INTO user_profiles (id, user_id, full_name, phone, avatar_url, date_of_birth, address, bio, created_at, updated_at)
VALUES
    (1,  1, 'Quản Trị Viên',   '0901000001', NULL, '1985-03-15', 'Hà Nội',             'System admin',                          NOW(), NOW()),
    (2,  2, 'Nguyễn Văn Minh', '0901000002', NULL, '1990-07-22', '123 Trần Phú, Đà Nẵng',  'Hướng dẫn viên 10 năm kinh nghiệm',    NOW(), NOW()),
    (3,  3, 'Trần Thị Lan',    '0901000003', NULL, '1992-11-05', '45 Nguyễn Huệ, TP.HCM',  'Chuyên tour miền Tây',                  NOW(), NOW()),
    (4,  4, 'Lê Thị Hoa',      '0912345678', NULL, '1995-01-20', '78 Lê Lợi, Huế',         'Yêu thích du lịch khám phá',            NOW(), NOW()),
    (5,  5, 'Phạm Văn Tuấn',   '0923456789', NULL, '1988-09-10', '22 Hai Bà Trưng, Hà Nội','Nhiếp ảnh gia nghiệp dư',               NOW(), NOW()),
    (6,  6, 'Đỗ Thị Mai',      '0934567890', NULL, '1997-04-18', '10 Bạch Đằng, Đà Nẵng',  'Thích đi biển',                         NOW(), NOW()),
    (7,  7, 'Hoàng Văn Đức',   '0945678901', NULL, '1993-12-30', '5 Phan Chu Trinh, Hội An','Digital nomad',                         NOW(), NOW()),
    (8,  8, 'Vũ Thị Linh',     '0956789012', NULL, '1999-06-25', '30 Nguyễn Trãi, TP.HCM', 'Sinh viên yêu du lịch',                 NOW(), NOW()),
    (9,  9, 'Bùi Văn Nam',     '0967890123', NULL, '1986-08-14', '15 Lý Thường Kiệt, Huế', 'Phượt thủ',                             NOW(), NOW()),
    (10,10, 'Ngô Thị Thảo',    '0978901234', NULL, '1994-02-28', '8 Trần Hưng Đạo, Nha Trang','Yêu thiên nhiên',                    NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('user_profiles_id_seq', (SELECT MAX(id) FROM user_profiles));

-- ── favorites ──
INSERT INTO favorites (id, user_id, tour_id, created_at)
VALUES
    (1, 4, 1, NOW()),
    (2, 4, 3, NOW()),
    (3, 5, 2, NOW()),
    (4, 5, 5, NOW()),
    (5, 6, 1, NOW()),
    (6, 6, 4, NOW()),
    (7, 7, 3, NOW()),
    (8, 8, 2, NOW()),
    (9, 8, 6, NOW()),
    (10, 9, 1, NOW()),
    (11, 9, 7, NOW()),
    (12, 10, 5, NOW())
ON CONFLICT DO NOTHING;

SELECT setval('favorites_id_seq', (SELECT MAX(id) FROM favorites));


-- ************************************************************
--  DATABASE: tour_db
-- ************************************************************
\connect tour_db;

-- ── tours ──
INSERT INTO tours (id, title, description, location, category, price, duration, max_participants, rating, review_count, itinerary, image_url, is_active, created_at, updated_at)
VALUES
    (1,
     'Khám Phá Vịnh Hạ Long',
     'Hành trình 2 ngày 1 đêm trên du thuyền 5 sao khám phá kỳ quan thiên nhiên thế giới Vịnh Hạ Long. Tham quan hang Sửng Sốt, đảo Ti Tốp, chèo kayak và thưởng thức hải sản tươi sống.',
     'Quảng Ninh', 'adventure', 3500000, 2, 25, 4.8, 12,
     '{"days": [{"day": 1, "title": "Hà Nội - Hạ Long", "activities": ["Di chuyển", "Check-in du thuyền", "Ăn trưa trên tàu", "Tham quan hang Sửng Sốt", "Chèo kayak"]}, {"day": 2, "title": "Hạ Long - Hà Nội", "activities": ["Tập Tai Chi", "Buffet sáng", "Tham quan đảo Ti Tốp", "Trả phòng"]}]}',
     'https://images.unsplash.com/photo-1528127269322-539801943592', TRUE, NOW(), NOW()),

    (2,
     'Phố Cổ Hội An & Đà Nẵng',
     'Tour 3 ngày 2 đêm khám phá phố cổ Hội An với đèn lồng lung linh, cầu Chùa cổ kính, và bãi biển Mỹ Khê Đà Nẵng. Trải nghiệm làm đèn lồng, học nấu ăn Hội An.',
     'Đà Nẵng - Hội An', 'culture', 4200000, 3, 20, 4.6, 8,
     '{"days": [{"day": 1, "title": "Đà Nẵng", "activities": ["Bà Nà Hills", "Cầu Vàng", "Bãi biển Mỹ Khê"]}, {"day": 2, "title": "Hội An", "activities": ["Phố cổ", "Làm đèn lồng", "Thả hoa đăng"]}, {"day": 3, "title": "Cù Lao Chàm", "activities": ["Lặn ngắm san hô", "Ăn hải sản"]}]}',
     'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', TRUE, NOW(), NOW()),

    (3,
     'Sapa - Fansipan Hùng Vĩ',
     'Chinh phục đỉnh Fansipan - nóc nhà Đông Dương. Trek qua bản Cát Cát, ruộng bậc thang Mường Hoa. Homestay cùng người H''Mông.',
     'Lào Cai', 'adventure', 2800000, 3, 15, 4.7, 15,
     '{"days": [{"day": 1, "title": "Hà Nội - Sapa", "activities": ["Di chuyển", "Bản Cát Cát", "Chợ đêm Sapa"]}, {"day": 2, "title": "Chinh phục Fansipan", "activities": ["Cáp treo Fansipan", "Đỉnh Fansipan", "Cầu kính Rồng Mây"]}, {"day": 3, "title": "Ruộng bậc thang", "activities": ["Thung lũng Mường Hoa", "Homestay"]}]}',
     'https://images.unsplash.com/photo-1570366583862-f91883984fde', TRUE, NOW(), NOW()),

    (4,
     'Đồng Bằng Sông Cửu Long',
     'Tour 2 ngày khám phá miền Tây sông nước. Thăm chợ nổi Cái Răng, vườn trái cây, làng nghề truyền thống. Đi xuồng ba lá qua kênh rạch.',
     'Cần Thơ - Bến Tre', 'culture', 1800000, 2, 30, 4.5, 10,
     '{"days": [{"day": 1, "title": "TP.HCM - Cần Thơ", "activities": ["Di chuyển", "Chợ nổi Cái Răng", "Vườn trái cây"]}, {"day": 2, "title": "Bến Tre", "activities": ["Đi xuồng ba lá", "Làng nghề kẹo dừa", "Về TP.HCM"]}]}',
     'https://images.unsplash.com/photo-1583417319070-4a69db38a482', TRUE, NOW(), NOW()),

    (5,
     'Phú Quốc - Đảo Ngọc',
     'Nghỉ dưỡng 4 ngày 3 đêm tại đảo Phú Quốc. Lặn ngắm san hô, câu cá, tham quan làng chài. Sunset party tại bãi Dài.',
     'Phú Quốc', 'beach', 5500000, 4, 20, 4.9, 20,
     '{"days": [{"day": 1, "title": "Check-in resort", "activities": ["Bay TP.HCM - Phú Quốc", "Check-in", "Tắm biển Bãi Dài"]}, {"day": 2, "title": "Tour 4 đảo", "activities": ["Lặn san hô", "Câu cá", "BBQ trên đảo"]}, {"day": 3, "title": "Khám phá đảo", "activities": ["Grand World", "Vinpearl Safari", "Sunset Sanato"]}, {"day": 4, "title": "Trở về", "activities": ["Chợ Dương Đông", "Mua quà", "Bay về"]}]}',
     'https://images.unsplash.com/photo-1559628233-100c798642d4', TRUE, NOW(), NOW()),

    (6,
     'Đà Lạt Mộng Mơ',
     'Tour 3 ngày 2 đêm tại thành phố ngàn hoa. Tham quan vườn hoa, thác Datanla, hồ Tuyền Lâm. Cắm trại dưới rừng thông.',
     'Đà Lạt', 'nature', 2500000, 3, 25, 4.4, 7,
     '{"days": [{"day": 1, "title": "TP.HCM - Đà Lạt", "activities": ["Di chuyển", "Quảng trường Lâm Viên", "Chợ đêm Đà Lạt"]}, {"day": 2, "title": "Khám phá", "activities": ["Thác Datanla", "Hồ Tuyền Lâm", "Đường hầm Đất Sét"]}, {"day": 3, "title": "Vườn hoa", "activities": ["Vườn hoa thành phố", "Cà phê view", "Trở về"]}]}',
     'https://images.unsplash.com/photo-1586953208448-b95a79798f07', TRUE, NOW(), NOW()),

    (7,
     'Huế - Cố Đô Xưa',
     'Tour 2 ngày 1 đêm tham quan di sản UNESCO: Đại Nội, lăng Tự Đức, chùa Thiên Mụ. Thưởng thức ẩm thực cung đình Huế.',
     'Huế', 'culture', 2200000, 2, 20, 4.3, 5,
     '{"days": [{"day": 1, "title": "Đại Nội & Lăng Tẩm", "activities": ["Đại Nội Huế", "Lăng Tự Đức", "Lăng Khải Định", "Ẩm thực cung đình"]}, {"day": 2, "title": "Chùa & Sông Hương", "activities": ["Chùa Thiên Mụ", "Du thuyền Sông Hương", "Chợ Đông Ba"]}]}',
     'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', TRUE, NOW(), NOW()),

    (8,
     'Ninh Bình - Tràng An',
     'Tour 1 ngày khám phá quần thể danh thắng Tràng An, chùa Bái Đính, cố đô Hoa Lư. Đi thuyền qua các hang động kỳ bí.',
     'Ninh Bình', 'nature', 950000, 1, 40, 4.6, 18,
     '{"days": [{"day": 1, "title": "Ninh Bình trọn ngày", "activities": ["Hà Nội đi Ninh Bình", "Chùa Bái Đính", "Tràng An", "Cố đô Hoa Lư", "Về Hà Nội"]}]}',
     'https://images.unsplash.com/photo-1573790387438-4da905039392', TRUE, NOW(), NOW()),

    (9,
     'Nha Trang - Biển Xanh',
     'Tour 3 ngày 2 đêm biển Nha Trang. Tham quan Vinpearl, tắm bùn khoáng, tour 4 đảo. Thưởng thức hải sản tươi sống.',
     'Nha Trang', 'beach', 3200000, 3, 25, 4.5, 9,
     '{"days": [{"day": 1, "title": "Check-in", "activities": ["Bay/xe đến Nha Trang", "Tháp Bà Ponagar", "Tắm biển"]}, {"day": 2, "title": "Tour 4 đảo", "activities": ["Hòn Mun lặn biển", "Hòn Một", "Hòn Tằm", "Tiệc trên tàu"]}, {"day": 3, "title": "Vinpearl", "activities": ["Vinpearl Land", "Tắm bùn I-Resort", "Trở về"]}]}',
     'https://images.unsplash.com/photo-1559628233-100c798642d4', TRUE, NOW(), NOW()),

    (10,
     'Mũi Né - Cát Trắng',
     'Tour 2 ngày 1 đêm tại Mũi Né. Khám phá đồi cát bay, suối Tiên, làng chài. Trượt cát và ngắm bình minh trên đồi cát.',
     'Bình Thuận', 'adventure', 1500000, 2, 30, 4.2, 6,
     '{"days": [{"day": 1, "title": "TP.HCM - Mũi Né", "activities": ["Di chuyển", "Đồi cát trắng", "Suối Tiên", "Làng chài"]}, {"day": 2, "title": "Bình minh & về", "activities": ["Ngắm bình minh đồi cát đỏ", "Trượt cát", "Về TP.HCM"]}]}',
     'https://images.unsplash.com/photo-1537956965359-7573183d1f57', TRUE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('tours_id_seq', (SELECT MAX(id) FROM tours));

-- ── tour_images ──
INSERT INTO tour_images (id, tour_id, image_url, caption, display_order, created_at)
VALUES
    -- Ha Long (tour 1)
    (1,  1, 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Vịnh Hạ Long toàn cảnh',   1, NOW()),
    (2,  1, 'https://images.unsplash.com/photo-1573790387438-4da905039392', 'Hang Sửng Sốt',            2, NOW()),
    (3,  1, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482', 'Chèo kayak',               3, NOW()),
    -- Hoi An (tour 2)
    (4,  2, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', 'Phố cổ Hội An',              1, NOW()),
    (5,  2, 'https://images.unsplash.com/photo-1555921015-5532091f6026', 'Đèn lồng Hội An',            2, NOW()),
    (6,  2, 'https://images.unsplash.com/photo-1570366583862-f91883984fde', 'Cầu Vàng Đà Nẵng',        3, NOW()),
    -- Sapa (tour 3)
    (7,  3, 'https://images.unsplash.com/photo-1570366583862-f91883984fde', 'Ruộng bậc thang Sapa',     1, NOW()),
    (8,  3, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07', 'Đỉnh Fansipan',            2, NOW()),
    -- Mekong (tour 4)
    (9,  4, 'https://images.unsplash.com/photo-1583417319070-4a69db38a482', 'Chợ nổi Cái Răng',         1, NOW()),
    (10, 4, 'https://images.unsplash.com/photo-1537956965359-7573183d1f57', 'Sông nước miền Tây',       2, NOW()),
    -- Phu Quoc (tour 5)
    (11, 5, 'https://images.unsplash.com/photo-1559628233-100c798642d4', 'Hoàng hôn Phú Quốc',         1, NOW()),
    (12, 5, 'https://images.unsplash.com/photo-1528127269322-539801943592', 'Lặn san hô',              2, NOW()),
    -- Da Lat (tour 6)
    (13, 6, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07', 'Đà Lạt sương mù',         1, NOW()),
    (14, 6, 'https://images.unsplash.com/photo-1555921015-5532091f6026', 'Vườn hoa Đà Lạt',            2, NOW()),
    -- Hue (tour 7)
    (15, 7, 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b', 'Đại Nội Huế',                1, NOW()),
    -- Ninh Binh (tour 8)
    (16, 8, 'https://images.unsplash.com/photo-1573790387438-4da905039392', 'Tràng An',                 1, NOW()),
    -- Nha Trang (tour 9)
    (17, 9, 'https://images.unsplash.com/photo-1559628233-100c798642d4', 'Biển Nha Trang',             1, NOW()),
    -- Mui Ne (tour 10)
    (18, 10,'https://images.unsplash.com/photo-1537956965359-7573183d1f57', 'Đồi cát Mũi Né',          1, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('tour_images_id_seq', (SELECT MAX(id) FROM tour_images));

-- ── tour_departures ──
INSERT INTO tour_departures (id, tour_id, departure_date, available_slots, price_modifier, status, created_at)
VALUES
    -- Ha Long
    (1,  1, '2026-05-10', 25, 1.00, 'OPEN', NOW()),
    (2,  1, '2026-05-17', 20, 1.00, 'OPEN', NOW()),
    (3,  1, '2026-06-07', 25, 1.10, 'OPEN', NOW()),
    (4,  1, '2026-07-01', 15, 1.20, 'OPEN', NOW()),
    -- Hoi An
    (5,  2, '2026-05-15', 20, 1.00, 'OPEN', NOW()),
    (6,  2, '2026-06-01', 18, 1.05, 'OPEN', NOW()),
    (7,  2, '2026-07-10', 20, 1.15, 'OPEN', NOW()),
    -- Sapa
    (8,  3, '2026-05-20', 15, 1.00, 'OPEN', NOW()),
    (9,  3, '2026-06-15', 12, 1.00, 'OPEN', NOW()),
    (10, 3, '2026-09-01', 15, 0.90, 'OPEN', NOW()),
    -- Mekong
    (11, 4, '2026-05-12', 30, 1.00, 'OPEN', NOW()),
    (12, 4, '2026-06-08', 28, 1.00, 'OPEN', NOW()),
    -- Phu Quoc
    (13, 5, '2026-06-01', 20, 1.00, 'OPEN', NOW()),
    (14, 5, '2026-07-15', 15, 1.25, 'OPEN', NOW()),
    (15, 5, '2026-08-01', 18, 1.20, 'OPEN', NOW()),
    -- Da Lat
    (16, 6, '2026-05-25', 25, 1.00, 'OPEN', NOW()),
    (17, 6, '2026-06-20', 22, 1.05, 'OPEN', NOW()),
    -- Hue
    (18, 7, '2026-05-30', 20, 1.00, 'OPEN', NOW()),
    (19, 7, '2026-06-28', 18, 1.10, 'OPEN', NOW()),
    -- Ninh Binh
    (20, 8, '2026-05-11', 40, 1.00, 'OPEN', NOW()),
    (21, 8, '2026-05-18', 35, 1.00, 'OPEN', NOW()),
    (22, 8, '2026-06-01', 40, 1.00, 'OPEN', NOW()),
    -- Nha Trang
    (23, 9, '2026-06-10', 25, 1.00, 'OPEN', NOW()),
    (24, 9, '2026-07-05', 20, 1.15, 'OPEN', NOW()),
    -- Mui Ne
    (25,10, '2026-05-16', 30, 1.00, 'OPEN', NOW()),
    (26,10, '2026-06-13', 28, 1.05, 'OPEN', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('tour_departures_id_seq', (SELECT MAX(id) FROM tour_departures));

-- ── reviews ──
INSERT INTO reviews (id, user_id, tour_id, booking_id, rating, title, comment, is_anonymous, status, created_at, updated_at)
VALUES
    (1, 4, 1, 1, 5.0, 'Tuyệt vời!',             'Du thuyền rất đẹp, dịch vụ tuyệt hảo. Hướng dẫn viên nhiệt tình. Sẽ quay lại!',                   FALSE, 'PUBLISHED', NOW(), NOW()),
    (2, 5, 1, 2, 4.5, 'Rất đáng tiền',           'Cảnh đẹp hùng vĩ, đồ ăn ngon. Chỉ hơi đông khách tí.',                                          FALSE, 'PUBLISHED', NOW(), NOW()),
    (3, 6, 2, 3, 4.0, 'Hội An xinh đẹp',         'Phố cổ rất đẹp về đêm. Nên đi vào mùa không mưa.',                                               FALSE, 'PUBLISHED', NOW(), NOW()),
    (4, 7, 3, 4, 5.0, 'Fansipan tuyệt đỉnh',     'Lên đỉnh Fansipan view cực đẹp. Thời tiết mát mẻ. Trek rất thú vị.',                             FALSE, 'PUBLISHED', NOW(), NOW()),
    (5, 8, 5, 5, 4.8, 'Thiên đường biển',         'Phú Quốc xứng đáng là đảo Ngọc. Nước biển trong vắt, san hô rất đẹp.',                           FALSE, 'PUBLISHED', NOW(), NOW()),
    (6, 9, 4, 6, 4.5, 'Miền Tây sông nước',       'Chợ nổi rất thú vị, trái cây miệt vườn ngon. Hướng dẫn vui tính.',                               FALSE, 'PUBLISHED', NOW(), NOW()),
    (7, 10,6, 7, 4.0, 'Đà Lạt lãng mạn',         'Thành phố ngàn hoa rất đẹp, se lạnh dễ chịu. Cà phê rất ngon!',                                  FALSE, 'PUBLISHED', NOW(), NOW()),
    (8, 4, 8, 8, 4.8, 'Ninh Bình tuyệt đẹp',     'Tràng An như phim Kong! Đi thuyền qua hang rất thú vị.',                                          FALSE, 'PUBLISHED', NOW(), NOW()),
    (9, 5, 5, NULL, 4.5, 'Sẽ quay lại Phú Quốc',  'Lần thứ 2 đi Phú Quốc vẫn thấy đẹp. Đặc biệt là sunset!',                                     FALSE, 'PUBLISHED', NOW(), NOW()),
    (10, 6, 9, 9, 4.2, 'Nha Trang vui',           'Biển đẹp, tour 4 đảo vui. Lặn biển nhìn san hô rất tuyệt.',                                      FALSE, 'PUBLISHED', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews));

-- ── itineraries ──
INSERT INTO itineraries (id, booking_id, day_number, activity_title, description, start_time, end_time, location, status, notes, created_at, updated_at)
VALUES
    -- Booking 1 (Ha Long 2 days)
    (1,  1, 1, 'Di chuyển Hà Nội - Hạ Long',    'Xe đón tại khách sạn, đi cao tốc 3.5h',        '07:00', '10:30', 'Hà Nội → Hạ Long',    'COMPLETED', NULL, NOW(), NOW()),
    (2,  1, 1, 'Check-in du thuyền',             'Nhận phòng, ăn trưa buffet trên tàu',           '11:00', '13:00', 'Cảng quốc tế Tuần Châu','COMPLETED', NULL, NOW(), NOW()),
    (3,  1, 1, 'Tham quan Hang Sửng Sốt',        'Thạch nhũ triệu năm, ánh sáng tự nhiên',       '14:00', '15:30', 'Hang Sửng Sốt',       'COMPLETED', NULL, NOW(), NOW()),
    (4,  1, 1, 'Chèo kayak',                     'Khám phá các hang nhỏ bằng kayak',              '16:00', '17:30', 'Vịnh Hạ Long',        'COMPLETED', NULL, NOW(), NOW()),
    (5,  1, 2, 'Tai Chi & Buffet sáng',           'Tập Tai Chi trên boong tàu, ăn sáng buffet',    '06:30', '08:30', 'Du thuyền',           'COMPLETED', NULL, NOW(), NOW()),
    (6,  1, 2, 'Tham quan đảo Ti Tốp',           'Leo 400 bậc lên đỉnh ngắm toàn cảnh',          '09:00', '11:00', 'Đảo Ti Tốp',          'COMPLETED', NULL, NOW(), NOW()),
    -- Booking 3 (Hoi An 3 days)
    (7,  3, 1, 'Bà Nà Hills & Cầu Vàng',        'Cáp treo lên Bà Nà, check-in Cầu Vàng',        '08:00', '16:00', 'Bà Nà Hills',         'PLANNED', NULL, NOW(), NOW()),
    (8,  3, 2, 'Phố cổ Hội An',                  'Tham quan chùa Cầu, nhà cổ, hội quán',          '09:00', '12:00', 'Phố cổ Hội An',       'PLANNED', NULL, NOW(), NOW()),
    (9,  3, 2, 'Workshop đèn lồng',              'Học làm đèn lồng truyền thống',                 '14:00', '16:00', 'Hội An',              'PLANNED', NULL, NOW(), NOW()),
    (10, 3, 2, 'Thả hoa đăng sông Hoài',         'Thả đèn hoa trên sông Hoài về đêm',            '19:00', '20:30', 'Sông Hoài',           'PLANNED', NULL, NOW(), NOW()),
    (11, 3, 3, 'Cù Lao Chàm - lặn biển',        'Tàu ra Cù Lao Chàm, lặn ngắm san hô',         '07:30', '16:00', 'Cù Lao Chàm',         'PLANNED', NULL, NOW(), NOW()),
    -- Booking 5 (Phu Quoc 4 days)
    (12, 5, 1, 'Bay & Check-in resort',           'Bay từ TP.HCM, nhận phòng resort bãi Dài',      '10:00', '14:00', 'Phú Quốc',            'PLANNED', NULL, NOW(), NOW()),
    (13, 5, 2, 'Tour 4 đảo',                     'Lặn san hô, câu cá, BBQ trên đảo',              '08:00', '16:00', 'Quần đảo An Thới',    'PLANNED', NULL, NOW(), NOW()),
    (14, 5, 3, 'Grand World & Safari',            'Tham quan Grand World, Vinpearl Safari',        '09:00', '17:00', 'Bắc đảo Phú Quốc',    'PLANNED', NULL, NOW(), NOW()),
    (15, 5, 4, 'Chợ Dương Đông & bay về',        'Mua đặc sản, bay về TP. HCM',                   '08:00', '15:00', 'Phú Quốc → TP.HCM',   'PLANNED', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('itineraries_id_seq', (SELECT MAX(id) FROM itineraries));

-- ── pricing_rules ──
INSERT INTO pricing_rules (id, name, type, conditions, modifier_type, modifier_value, priority, is_active, tour_id, valid_from, valid_until, created_at, updated_at)
VALUES
    (1, 'Giảm giá nhóm 5+',       'GROUP',      '{"minGroup": 5}',                                      'PERCENTAGE', -10.00, 5,  TRUE, NULL, NULL, NULL, NOW(), NOW()),
    (2, 'Giảm giá nhóm 10+',      'GROUP',      '{"minGroup": 10}',                                     'PERCENTAGE', -15.00, 6,  TRUE, NULL, NULL, NULL, NOW(), NOW()),
    (3, 'Cao điểm hè',            'SEASONAL',   '{"seasonStart": "06-01", "seasonEnd": "08-31"}',        'PERCENTAGE',  20.00, 10, TRUE, NULL, '2026-06-01T00:00:00', '2026-08-31T23:59:59', NOW(), NOW()),
    (4, 'Giảm giá Tết dương lịch','SEASONAL',   '{"seasonStart": "12-20", "seasonEnd": "01-05"}',        'PERCENTAGE',  15.00, 10, TRUE, NULL, '2026-12-20T00:00:00', '2027-01-05T23:59:59', NOW(), NOW()),
    (5, 'Early Bird 30 ngày',     'EARLYBIRD',  '{"daysBeforeDeparture": 30}',                           'PERCENTAGE', -5.00,  3,  TRUE, NULL, NULL, NULL, NOW(), NOW()),
    (6, 'Last Minute 3 ngày',     'LASTMINUTE', '{"daysBeforeDeparture": 3}',                            'PERCENTAGE', -20.00, 8,  TRUE, NULL, NULL, NULL, NOW(), NOW()),
    (7, 'Trẻ em dưới 12',         'AGE',        '{"maxAge": 12}',                                        'PERCENTAGE', -30.00, 2,  TRUE, NULL, NULL, NULL, NOW(), NOW()),
    (8, 'Phú Quốc cuối tuần +5%', 'SEASONAL',   '{"seasonStart": "01-01", "seasonEnd": "12-31"}',        'PERCENTAGE',   5.00, 4,  TRUE, 5,   NULL, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('pricing_rules_id_seq', (SELECT MAX(id) FROM pricing_rules));

-- ── promo_codes ──
INSERT INTO promo_codes (id, code, description, rule_id, max_uses, current_uses, valid_from, valid_until, is_active)
VALUES
    (1, 'WELCOME2026',  'Giảm 10% cho khách mới',                 1, 500,  42,  '2026-01-01T00:00:00', '2026-12-31T23:59:59', TRUE),
    (2, 'SUMMER25',     'Khuyến mãi hè 2026 giảm thêm 5%',       5, 200,  15,  '2026-06-01T00:00:00', '2026-08-31T23:59:59', TRUE),
    (3, 'PHUQUOC10',    'Giảm 10% tour Phú Quốc',                 1, 100,   8,  '2026-01-01T00:00:00', '2026-06-30T23:59:59', TRUE),
    (4, 'TETDULICH',    'Khuyến mãi Tết 2027',                    4, 300,   0,  '2026-12-15T00:00:00', '2027-01-10T23:59:59', TRUE),
    (5, 'VIP50',        'Giảm 50% cho khách VIP (nội bộ)',        NULL, 10, 2,  '2026-01-01T00:00:00', '2027-12-31T23:59:59', TRUE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('promo_codes_id_seq', (SELECT MAX(id) FROM promo_codes));

-- ── guide_schedules ──
INSERT INTO guide_schedules (id, guide_user_id, tour_id, booking_id, start_date, end_date, status, notes, created_at)
VALUES
    (1, 2, 1, 1, '2026-05-10', '2026-05-11', 'ASSIGNED',  'Tour Ha Long nhóm 1',       NOW()),
    (2, 2, 1, 2, '2026-05-17', '2026-05-18', 'ASSIGNED',  'Tour Ha Long nhóm 2',       NOW()),
    (3, 3, 2, 3, '2026-05-15', '2026-05-17', 'ASSIGNED',  'Tour Hội An nhóm 1',        NOW()),
    (4, 2, 3, 4, '2026-05-20', '2026-05-22', 'ASSIGNED',  'Tour Sapa (trek + peak)',    NOW()),
    (5, 3, 5, 5, '2026-06-01', '2026-06-04', 'ASSIGNED',  'Tour Phú Quốc luxury',      NOW()),
    (6, 2, 4, 6, '2026-05-12', '2026-05-13', 'COMPLETED', 'Tour Miền Tây - done',      NOW()),
    (7, 3, 6, 7, '2026-05-25', '2026-05-27', 'ASSIGNED',  'Tour Đà Lạt nhóm',          NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('guide_schedules_id_seq', (SELECT MAX(id) FROM guide_schedules));


-- ************************************************************
--  DATABASE: booking_db
-- ************************************************************
\connect booking_db;

-- ── bookings ──
INSERT INTO bookings (id, user_id, tour_id, departure_id, booking_date, travelers, status, total_price, contact_name, contact_phone, special_requests, payment_method, payment_status, paid_at, created_at, updated_at)
VALUES
    (1,  4, 1,  1,  '2026-04-20', 2, 'CONFIRMED', 7000000.00,  'Lê Thị Hoa',     '0912345678', NULL,                        'BANK_TRANSFER', 'PAID',   '2026-04-20T15:30:00', NOW(), NOW()),
    (2,  5, 1,  2,  '2026-04-21', 3, 'CONFIRMED', 10500000.00, 'Phạm Văn Tuấn',   '0923456789', 'Phòng view biển',           'MOMO',          'PAID',   '2026-04-21T10:00:00', NOW(), NOW()),
    (3,  6, 2,  5,  '2026-04-22', 2, 'CONFIRMED', 8400000.00,  'Đỗ Thị Mai',      '0934567890', 'Ăn chay',                   'VNPAY',         'PAID',   '2026-04-22T09:00:00', NOW(), NOW()),
    (4,  7, 3,  8,  '2026-04-23', 1, 'CONFIRMED', 2800000.00,  'Hoàng Văn Đức',   '0945678901', NULL,                        'CASH',          'PAID',   '2026-04-25T08:00:00', NOW(), NOW()),
    (5,  8, 5, 13,  '2026-04-24', 2, 'PENDING',   11000000.00, 'Vũ Thị Linh',     '0956789012', 'Phòng đôi, honeymoon',      'BANK_TRANSFER', 'UNPAID', NULL,                  NOW(), NOW()),
    (6,  9, 4, 11,  '2026-04-25', 4, 'CONFIRMED', 7200000.00,  'Bùi Văn Nam',     '0967890123', 'Nhóm bạn 4 người',          'MOMO',          'PAID',   '2026-04-25T14:00:00', NOW(), NOW()),
    (7, 10, 6, 16,  '2026-04-26', 2, 'CONFIRMED', 5000000.00,  'Ngô Thị Thảo',    '0978901234', NULL,                        'VNPAY',         'PAID',   '2026-04-26T11:00:00', NOW(), NOW()),
    (8,  4, 8, 20,  '2026-04-27', 5, 'CONFIRMED', 4750000.00,  'Lê Thị Hoa',      '0912345678', 'Gia đình 5 người, 2 trẻ em','CASH',          'PAID',   '2026-04-28T08:00:00', NOW(), NOW()),
    (9,  6, 9, 23,  '2026-04-28', 2, 'PENDING',   6400000.00,  'Đỗ Thị Mai',      '0934567890', 'Muốn lặn biển sâu',        'BANK_TRANSFER', 'UNPAID', NULL,                  NOW(), NOW()),
    (10, 5, 10,25,  '2026-04-29', 3, 'CANCELLED', 4500000.00,  'Phạm Văn Tuấn',   '0923456789', NULL,                        'MOMO',          'REFUNDED','2026-04-30T10:00:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));

-- ── payments ──
INSERT INTO payments (id, booking_id, user_id, amount, currency, payment_method, status, provider_transaction_id, provider_response, paid_at, created_at, updated_at)
VALUES
    (1,  1,  4,  7000000.00, 'VND', 'BANK_TRANSFER', 'COMPLETED', 'VCB-20260420-001',  '{"bank":"Vietcombank","status":"success"}',  '2026-04-20T15:30:00', NOW(), NOW()),
    (2,  2,  5, 10500000.00, 'VND', 'MOMO',          'COMPLETED', 'MOMO-20260421-002', '{"wallet":"MoMo","status":"success"}',       '2026-04-21T10:00:00', NOW(), NOW()),
    (3,  3,  6,  8400000.00, 'VND', 'VNPAY',         'COMPLETED', 'VNPAY-20260422-003','{"gateway":"VNPay","status":"00"}',           '2026-04-22T09:00:00', NOW(), NOW()),
    (4,  4,  7,  2800000.00, 'VND', 'CASH',          'COMPLETED', NULL,                 NULL,                                         '2026-04-25T08:00:00', NOW(), NOW()),
    (5,  5,  8, 11000000.00, 'VND', 'BANK_TRANSFER', 'PENDING',   NULL,                 NULL,                                         NULL,                  NOW(), NOW()),
    (6,  6,  9,  7200000.00, 'VND', 'MOMO',          'COMPLETED', 'MOMO-20260425-006', '{"wallet":"MoMo","status":"success"}',       '2026-04-25T14:00:00', NOW(), NOW()),
    (7,  7, 10,  5000000.00, 'VND', 'VNPAY',         'COMPLETED', 'VNPAY-20260426-007','{"gateway":"VNPay","status":"00"}',           '2026-04-26T11:00:00', NOW(), NOW()),
    (8,  8,  4,  4750000.00, 'VND', 'CASH',          'COMPLETED', NULL,                 NULL,                                         '2026-04-28T08:00:00', NOW(), NOW()),
    (9,  9,  6,  6400000.00, 'VND', 'BANK_TRANSFER', 'PENDING',   NULL,                 NULL,                                         NULL,                  NOW(), NOW()),
    (10, 10,  5,  4500000.00, 'VND', 'MOMO',          'REFUNDED',  'MOMO-20260429-010', '{"wallet":"MoMo","status":"refunded"}',      '2026-04-30T10:00:00', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- ── transactions ──
INSERT INTO transactions (id, payment_id, type, amount, status, provider_data, created_at)
VALUES
    (1,  1, 'CHARGE',  7000000.00,  'SUCCESS',  '{"ref":"VCB-20260420-001"}',  NOW()),
    (2,  2, 'CHARGE', 10500000.00,  'SUCCESS',  '{"ref":"MOMO-20260421-002"}', NOW()),
    (3,  3, 'CHARGE',  8400000.00,  'SUCCESS',  '{"ref":"VNPAY-20260422-003"}',NOW()),
    (4,  4, 'CHARGE',  2800000.00,  'SUCCESS',  '{"method":"CASH"}',           NOW()),
    (5,  6, 'CHARGE',  7200000.00,  'SUCCESS',  '{"ref":"MOMO-20260425-006"}', NOW()),
    (6,  7, 'CHARGE',  5000000.00,  'SUCCESS',  '{"ref":"VNPAY-20260426-007"}',NOW()),
    (7,  8, 'CHARGE',  4750000.00,  'SUCCESS',  '{"method":"CASH"}',           NOW()),
    (8, 10, 'CHARGE',  4500000.00,  'SUCCESS',  '{"ref":"MOMO-20260429-010"}', NOW()),
    (9, 10, 'REFUND',  4500000.00,  'SUCCESS',  '{"ref":"MOMO-REF-010"}',      NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

-- ── expenses ──
INSERT INTO expenses (id, tour_id, booking_id, guide_id, itinerary_day, category, amount, currency, description, status, created_by, approved_by, approved_at, created_at, updated_at)
VALUES
    -- Tour Ha Long booking 1
    (1,  1, 1, 2, 1, 'TRANSPORT',      800000.00,  'VND', 'Xe đón khách Hà Nội - Hạ Long (đi)',    'APPROVED', 2, 1, NOW(), NOW(), NOW()),
    (2,  1, 1, 2, 1, 'MEALS',          350000.00,  'VND', 'Ăn trưa buffet du thuyền',               'APPROVED', 2, 1, NOW(), NOW(), NOW()),
    (3,  1, 1, 2, 1, 'ENTRANCE_FEE',   250000.00,  'VND', 'Vé tham quan Hang Sửng Sốt',            'APPROVED', 2, 1, NOW(), NOW(), NOW()),
    (4,  1, 1, 2, 1, 'EQUIPMENT',       100000.00,  'VND', 'Thuê kayak 2 chiếc',                    'APPROVED', 2, 1, NOW(), NOW(), NOW()),
    (5,  1, 1, 2, 2, 'TRANSPORT',      800000.00,  'VND', 'Xe đón khách Hạ Long - Hà Nội (về)',    'APPROVED', 2, 1, NOW(), NOW(), NOW()),
    -- Tour Hoi An booking 3
    (6,  2, 3, 3, 1, 'TRANSPORT',     1200000.00,  'VND', 'Xe 16 chỗ Đà Nẵng 1 ngày',             'APPROVED', 3, 1, NOW(), NOW(), NOW()),
    (7,  2, 3, 3, 1, 'ENTRANCE_FEE',   300000.00,  'VND', 'Vé cáp treo Bà Nà Hills (2 người)',     'APPROVED', 3, 1, NOW(), NOW(), NOW()),
    (8,  2, 3, 3, 2, 'MEALS',          200000.00,  'VND', 'Cao lầu & mì Quảng Hội An',             'APPROVED', 3, 1, NOW(), NOW(), NOW()),
    -- Tour Mekong booking 6
    (9,  4, 6, 3, 1, 'TRANSPORT',      600000.00,  'VND', 'Xe 16 chỗ TP.HCM - Cần Thơ',           'APPROVED', 3, 1, NOW(), NOW(), NOW()),
    (10, 4, 6, 3, 1, 'MEALS',          400000.00,  'VND', 'Ăn trưa nhóm 4 người miệt vườn',       'PENDING',  3, NULL, NULL, NOW(), NOW()),
    -- Pending expenses
    (11, 5, 5, NULL, 1, 'ACCOMMODATION', 3500000.00,'VND', 'Resort bãi Dài 3 đêm (đã đặt cọc)',    'PENDING',  NULL, NULL, NULL, NOW(), NOW()),
    (12, 6, 7, 3, 1, 'GUIDE_FEE',      500000.00,  'VND', 'Phí hướng dẫn Đà Lạt 3 ngày',          'PENDING',  3, NULL, NULL, NOW(), NOW()),
    (13, 3, 4, 2, 1, 'INSURANCE',       150000.00,  'VND', 'Bảo hiểm trek Fansipan (1 người)',      'APPROVED', 2, 1, NOW(), NOW(), NOW()),
    (14, 9, 9, NULL, 1, 'EQUIPMENT',     200000.00,  'VND', 'Thuê đồ lặn bộ 2',                     'PENDING',  NULL, NULL, NULL, NOW(), NOW()),
    (15, 1, 2, 2, 1, 'EMERGENCY',       180000.00,  'VND', 'Mua thuốc say sóng cho khách',          'APPROVED', 2, 1, NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('expenses_id_seq', (SELECT MAX(id) FROM expenses));

-- ── expense_attachments ──
INSERT INTO expense_attachments (id, expense_id, file_name, file_url, file_size, content_type, created_at)
VALUES
    (1, 1, 'hoadon_xe_halong.jpg',     '/storage/expenses/1/hoadon_xe_halong.jpg',     245000, 'image/jpeg', NOW()),
    (2, 2, 'hoadon_buffet.jpg',        '/storage/expenses/2/hoadon_buffet.jpg',        189000, 'image/jpeg', NOW()),
    (3, 6, 'hoadon_xe_danang.pdf',     '/storage/expenses/6/hoadon_xe_danang.pdf',     320000, 'application/pdf', NOW()),
    (4, 7, 've_bana_hills.jpg',        '/storage/expenses/7/ve_bana_hills.jpg',        156000, 'image/jpeg', NOW()),
    (5, 9, 'hoadon_xe_cantho.jpg',     '/storage/expenses/9/hoadon_xe_cantho.jpg',     210000, 'image/jpeg', NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('expense_attachments_id_seq', (SELECT MAX(id) FROM expense_attachments));


-- ************************************************************
--  DATABASE: platform_db
-- ************************************************************
\connect platform_db;

-- ── notifications ──
INSERT INTO notifications (id, user_id, title, message, type, reference_type, reference_id, is_read, created_at)
VALUES
    -- Booking confirmations
    (1,  4, 'Đặt tour thành công',        'Bạn đã đặt tour "Khám Phá Vịnh Hạ Long" cho 2 người ngày 10/05/2026. Mã booking: #1',    'BOOKING',  'BOOKING', 1, TRUE,  NOW()),
    (2,  5, 'Đặt tour thành công',        'Bạn đã đặt tour "Khám Phá Vịnh Hạ Long" cho 3 người ngày 17/05/2026. Mã booking: #2',    'BOOKING',  'BOOKING', 2, TRUE,  NOW()),
    (3,  6, 'Đặt tour thành công',        'Bạn đã đặt tour "Phố Cổ Hội An & Đà Nẵng" cho 2 người ngày 15/05/2026. Mã booking: #3', 'BOOKING',  'BOOKING', 3, TRUE,  NOW()),
    (4,  7, 'Đặt tour thành công',        'Bạn đã đặt tour "Sapa - Fansipan Hùng Vĩ" ngày 20/05/2026. Mã booking: #4',             'BOOKING',  'BOOKING', 4, FALSE, NOW()),
    (5,  8, 'Đặt tour chờ thanh toán',    'Tour "Phú Quốc - Đảo Ngọc" đang chờ thanh toán. Vui lòng thanh toán trong 24h.',          'BOOKING',  'BOOKING', 5, FALSE, NOW()),
    -- Payment notifications
    (6,  4, 'Thanh toán thành công',       'Đã nhận thanh toán 7,000,000 VND cho booking #1 qua BANK_TRANSFER.',                      'PAYMENT',  'PAYMENT', 1, TRUE,  NOW()),
    (7,  5, 'Thanh toán thành công',       'Đã nhận thanh toán 10,500,000 VND cho booking #2 qua MOMO.',                              'PAYMENT',  'PAYMENT', 2, TRUE,  NOW()),
    (8,  6, 'Thanh toán thành công',       'Đã nhận thanh toán 8,400,000 VND cho booking #3 qua VNPAY.',                              'PAYMENT',  'PAYMENT', 3, FALSE, NOW()),
    -- System announcements
    (9,  4, 'Khuyến mãi hè 2026!',        'Sử dụng mã SUMMER25 để được giảm 5% cho tất cả tour mùa hè. Có hiệu lực từ 01/06.',     'PROMOTION','PROMO',   2, FALSE, NOW()),
    (10, 5, 'Khuyến mãi hè 2026!',        'Sử dụng mã SUMMER25 để được giảm 5% cho tất cả tour mùa hè. Có hiệu lực từ 01/06.',     'PROMOTION','PROMO',   2, FALSE, NOW()),
    (11, 6, 'Khuyến mãi hè 2026!',        'Sử dụng mã SUMMER25 để được giảm 5% cho tất cả tour mùa hè. Có hiệu lực từ 01/06.',     'PROMOTION','PROMO',   2, FALSE, NOW()),
    (12, 7, 'Khuyến mãi hè 2026!',        'Sử dụng mã SUMMER25 để được giảm 5% cho tất cả tour mùa hè. Có hiệu lực từ 01/06.',     'PROMOTION','PROMO',   2, FALSE, NOW()),
    -- Review reminders
    (13, 4, 'Đánh giá tour của bạn',      'Hãy chia sẻ trải nghiệm của bạn về tour "Khám Phá Vịnh Hạ Long" nhé!',                   'SYSTEM',   'TOUR',    1, TRUE,  NOW()),
    (14, 9, 'Đánh giá tour của bạn',      'Hãy chia sẻ trải nghiệm của bạn về tour "Đồng Bằng Sông Cửu Long" nhé!',                'SYSTEM',   'TOUR',    4, FALSE, NOW()),
    -- Guide assignments
    (15, 2, 'Lịch hướng dẫn mới',         'Bạn được phân công hướng dẫn tour "Khám Phá Vịnh Hạ Long" ngày 10/05/2026.',             'SYSTEM',   'BOOKING', 1, TRUE,  NOW()),
    (16, 3, 'Lịch hướng dẫn mới',         'Bạn được phân công hướng dẫn tour "Phố Cổ Hội An & Đà Nẵng" ngày 15/05/2026.',          'SYSTEM',   'BOOKING', 3, FALSE, NOW()),
    -- Admin alerts
    (17, 1, 'Chi phí cần duyệt',          'Có 5 khoản chi phí mới đang chờ duyệt. Vui lòng kiểm tra.',                              'SYSTEM',   NULL,     NULL, FALSE, NOW()),
    (18, 1, 'Booking mới chờ xử lý',      'Có 2 booking mới chưa thanh toán cần theo dõi.',                                          'SYSTEM',   NULL,     NULL, FALSE, NOW()),
    -- Cancellation
    (19, 5, 'Tour đã hủy',                'Booking #10 tour "Mũi Né - Cát Trắng" đã được hủy. Hoàn tiền 4,500,000 VND qua MOMO.',  'BOOKING',  'BOOKING',10, TRUE,  NOW()),
    (20, 1, 'Booking bị hủy',             'Khách hàng Phạm Văn Tuấn đã hủy booking #10 tour Mũi Né. Đã hoàn tiền.',                 'SYSTEM',   'BOOKING',10, FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

SELECT setval('notifications_id_seq', (SELECT MAX(id) FROM notifications));


-- ============================================================
-- SEED DATA COMPLETE
-- ============================================================
-- Summary:
--   identity_db : 10 users, 10 profiles, 12 favorites
--   tour_db     : 10 tours, 18 images, 26 departures, 10 reviews,
--                 15 itinerary items, 8 pricing rules, 5 promo codes,
--                 7 guide schedules
--   booking_db  : 10 bookings, 10 payments, 9 transactions,
--                 15 expenses, 5 expense attachments
--   platform_db : 20 notifications
-- ============================================================
