
USE housekeeping_service;

-- ============================================================
-- 0. SERVICES (6 dịch vụ cốt lõi)
-- ============================================================
INSERT IGNORE INTO services (service_name, description, base_price, slug, is_active) VALUES
('Dọn dẹp nhà cửa',    'Lau chùi, quét hút bụi, lau sàn, vệ sinh phòng bếp, phòng tắm toàn bộ căn nhà', 50000.00, 'don-dep-nha-cua',    TRUE),
('Giặt ủi',            'Giặt máy, phơi đồ, ủi quần áo và gấp gọn theo yêu cầu',                          50000.00, 'giat-ui',            TRUE),
('Nấu ăn',             'Nấu các bữa ăn gia đình theo thực đơn thỏa thuận, vệ sinh bếp sau khi nấu',       55000.00, 'nau-an',             TRUE),
('Chăm sóc trẻ em',    'Trông giữ, chơi cùng và chăm sóc trẻ theo độ tuổi, đảm bảo an toàn',             60000.00, 'cham-soc-tre-em',    TRUE),
('Chăm sóc người già', 'Hỗ trợ vệ sinh cá nhân, ăn uống, đi lại và trò chuyện cùng người cao tuổi',      65000.00, 'cham-soc-nguoi-gia', TRUE),
('Vệ sinh công nghiệp','Vệ sinh sâu sau xây dựng, sửa chữa; tẩy rửa kính, sàn, thiết bị nặng',          70000.00, 've-sinh-cong-nghiep',TRUE);

-- ============================================================
-- 1. USERS (25 users: 1 admin, 4 customers, 20 helpers)
-- Mật khẩu mẫu: "123456" -> hash bcrypt
INSERT INTO users (email, password_hash, full_name, phone, user_type, avatar_url, is_active) VALUES
-- Admin
('admin@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Quản Trị Viên', '0901234567', 'admin', 'https://via.placeholder.com/150', TRUE),

-- Customers (4)
('nguyenvanbay@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Nguyễn Văn Bảy', '0912345678', 'customer', 'https://via.placeholder.com/150', TRUE),
('tranthitoan@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Trần Thị Toán', '0923456789', 'customer', 'https://via.placeholder.com/150', TRUE),
('ngoquangnguyen@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Ngô Quang Nguyện', '0934567890', 'customer', 'https://via.placeholder.com/150', TRUE),
('phamthiqgiang@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Phạm Thị Quỳnh Giang', '0945678901', 'customer', 'https://via.placeholder.com/150', TRUE),

-- Helpers (12)
('nguyenthimai@gmail.com',      '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Nguyễn Thị Mai',       '0956789012', 'helper', '/avatars/helper-1.svg',  TRUE),
('tranthilan@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Trần Thị Lan',         '0967890123', 'helper', '/avatars/helper-2.svg',  TRUE),
('lethihuong@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Lê Thị Hương',         '0978901234', 'helper', '/avatars/helper-3.svg',  TRUE),
('phamthinga@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Phạm Thị Nga',         '0989012345', 'helper', '/avatars/helper-4.svg',  TRUE),
('hoangthily@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Hoàng Thị Ly',         '0990123456', 'helper', '/avatars/helper-5.svg',  TRUE),
('vuthithanh@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Vũ Thị Thanh',         '0901234568', 'helper', '/avatars/helper-6.svg',  TRUE),
('dothihoa@gmail.com',          '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Đỗ Thị Hoa',           '0912345679', 'helper', '/avatars/helper-7.svg',  TRUE),
('buithilinh@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Bùi Thị Linh',         '0923456780', 'helper', '/avatars/helper-8.svg',  TRUE),
('duongthiphuong@gmail.com',    '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Dương Thị Phương',     '0934567891', 'helper', '/avatars/helper-9.svg',  TRUE),
('ngothithao@gmail.com',        '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Ngô Thị Thảo',         '0945678902', 'helper', '/avatars/helper-10.svg', TRUE),
('dangthituyet@gmail.com',      '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Đặng Thị Tuyết',       '0956789013', 'helper', '/avatars/helper-11.svg', TRUE),
('dinhthuha@gmail.com',         '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Đinh Thị Thu Hà',      '0967890124', 'helper', '/avatars/helper-12.svg', TRUE),

-- Helpers mới (user_id 18–25)
('lythibichngoc@gmail.com',    '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Lý Thị Bích Ngọc',     '0971234501', 'helper', '/avatars/helper-13.svg', TRUE),
('trinhthiminhchau@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Trịnh Thị Minh Châu',  '0982345602', 'helper', '/avatars/helper-14.svg', TRUE),
('caothithuthuy@gmail.com',    '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Cao Thị Thu Thủy',     '0993456703', 'helper', '/avatars/helper-15.svg', TRUE),
('luuthihongnhung@gmail.com',  '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Lưu Thị Hồng Nhung',   '0904567804', 'helper', '/avatars/helper-16.svg', TRUE),
('phungthidieulinh@gmail.com', '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Phùng Thị Diệu Linh',  '0915678905', 'helper', '/avatars/helper-17.svg', TRUE),
('tothibaotran@gmail.com',     '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Tô Thị Bảo Trân',      '0926789006', 'helper', '/avatars/helper-18.svg', TRUE),
('quachthimyduyen@gmail.com',  '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Quách Thị Mỹ Duyên',   '0937890107', 'helper', '/avatars/helper-19.svg', TRUE),
('macthihaiyen@gmail.com',     '\$2a\$10\$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq', 'Mạc Thị Hải Yến',      '0948901208', 'helper', '/avatars/helper-20.svg', TRUE);

-- 2. CUSTOMERS

INSERT INTO customers (user_id, address, district, city, preferred_payment, loyalty_points) VALUES
(2, '123 Nguyễn Trãi, Phường Thượng Đình', 'Thanh Xuân', 'Hà Nội', 'cash', 100),
(3, '456 Trần Duy Hưng, Phường Trung Hòa', 'Cầu Giấy', 'Hà Nội', 'e_wallet', 50),
(4, '789 Láng Hạ, Phường Thành Công', 'Ba Đình', 'Hà Nội', 'bank_transfer', 200),
(5, '321 Giải Phóng, Phường Bách Khoa', 'Hai Bà Trưng', 'Hà Nội', 'cash', 0);

-- 3. HELPERS (20 người giúp việc tại Hà Nội)

INSERT INTO helpers (user_id, date_of_birth, gender, id_card_number, address, experience_years, rating_average, total_bookings, hourly_rate, is_verified, is_available, bio) VALUES
(6, '1990-05-15', 'female', '001090001234', '45 Hàng Bài, P. Tràng Tiền, Hoàn Kiếm, Hà Nội', 5, 4.80, 120, 70000.00, TRUE, TRUE, 'Tôi có 5 năm kinh nghiệm làm việc nhà, chuyên dọn dẹp và nấu ăn. Tận tâm và chu đáo.'),
(7, '1992-08-20', 'female', '001092002345', '78 Giảng Võ, P. Giảng Võ, Ba Đình, Hà Nội', 3, 4.50, 80, 65000.00, TRUE, TRUE, 'Tôi giỏi giặt ủi và chăm sóc trẻ em. Yêu trẻ con và rất kiên nhẫn.'),
(8, '1988-03-10', 'female', '001088003456', '123 Láng Hạ, P. Láng Hạ, Đống Đa, Hà Nội', 7, 4.90, 200, 80000.00, TRUE, TRUE, 'Chuyên gia dọn dẹp với 7 năm kinh nghiệm. Đảm bảo nhà sạch sẽ như mới.'),
(9, '1995-11-25', 'female', '001095004567', '56 Tôn Đức Thắng, P. Quốc Tử Giám, Đống Đa, Hà Nội', 2, 4.20, 45, 60000.00, TRUE, TRUE, 'Mới bắt đầu nhưng rất nhiệt tình. Học hỏi nhanh và làm việc chăm chỉ.'),
(10, '1985-07-30', 'female', '001085005678', '234 Nguyễn Chí Thanh, P. Láng Thượng, Đống Đa, Hà Nội', 8, 4.75, 180, 75000.00, TRUE, TRUE, 'Có 8 năm kinh nghiệm dọn dẹp và nấu ăn. Làm việc nhanh gọn và sạch sẽ.'),
(11, '1993-06-12', 'female', '001093006789', '89 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội', 4, 4.60, 95, 68000.00, TRUE, TRUE, 'Tôi chuyên về giặt ủi và dọn dẹp nhà cửa. Luôn tận tâm với công việc.'),
(12, '1991-09-18', 'female', '001091007890', '167 Tây Sơn, P. Quang Trung, Đống Đa, Hà Nội', 6, 4.85, 150, 72000.00, TRUE, TRUE, 'Chuyên nấu ăn và dọn dẹp. Có thể nấu nhiều món ăn gia đình ngon.'),
(13, '1994-12-05', 'female', '001094008901', '45 Chùa Bộc, P. Quang Trung, Đống Đa, Hà Nội', 3, 4.40, 65, 63000.00, TRUE, TRUE, 'Tôi giỏi chăm sóc trẻ em và người già. Kiên nhẫn và tận tình.'),
(14, '1989-04-22', 'female', '001089009012', '78 Trần Duy Hưng, P. Trung Hòa, Cầu Giấy, Hà Nội', 7, 4.88, 190, 78000.00, TRUE, TRUE, 'Chuyên gia vệ sinh công nghiệp và dọn dẹp nhà cửa. Làm việc chuyên nghiệp.'),
(15, '1996-01-30', 'female', '001096010123', '123 Hoàng Quốc Việt, P. Nghĩa Đô, Cầu Giấy, Hà Nội', 2, 4.30, 40, 62000.00, TRUE, TRUE, 'Mới vào nghề nhưng rất cố gắng. Học hỏi nhanh và làm việc chăm chỉ.'),
(16, '1987-11-08', 'female', '001087011234', '234 Phạm Văn Đồng, P. Cổ Nhuế, Bắc Từ Liêm, Hà Nội', 9, 4.92, 220, 82000.00, TRUE, TRUE, 'Có 9 năm kinh nghiệm trong nghề. Chuyên tất cả các loại công việc nhà. Rất được khách hàng tin tưởng.'),
(17, '1986-03-25', 'female', '001086012345', '56 Nguyễn Văn Cừ, P. Gia Thụy, Long Biên, Hà Nội',              10, 4.95, 250, 85000.00, TRUE, TRUE, 'Thợ chuyên nghiệp với 10 năm kinh nghiệm. Chuyên vệ sinh công nghiệp, chăm sóc người già và sửa chữa nhỏ trong nhà.'),

-- Helpers mới (helper_id 13–20, user_id 18–25)
(18, '1993-07-14', 'female', '001093013456', '12 Nguyễn Tam Trinh, P. Hoàng Văn Thụ, Hoàng Mai, Hà Nội',     4, 4.55, 90,  66000.00, TRUE, TRUE, 'Chăm chỉ, cẩn thận trong từng công việc. Chuyên dọn dẹp và giặt ủi, luôn hoàn thành đúng giờ.'),
(19, '1990-02-28', 'female', '001090014567', '34 Trường Chinh, P. Phương Liệt, Thanh Xuân, Hà Nội',          6, 4.70, 140, 73000.00, TRUE, TRUE, 'Giàu kinh nghiệm nấu ăn gia đình. Có thể nấu nhiều món miền Bắc, miền Trung theo yêu cầu.'),
(20, '1997-05-09', 'female', '001097015678', '78 Thụy Khuê, P. Thụy Khuê, Tây Hồ, Hà Nội',                  3, 4.35, 60,  62000.00, TRUE, TRUE, 'Trẻ trung, năng động. Giỏi chăm sóc trẻ nhỏ và làm việc nhà. Thân thiện và được các gia đình tin tưởng.'),
(21, '1988-11-17', 'female', '001088016789', '90 Lê Văn Lương, P. Nhân Chính, Nam Từ Liêm, Hà Nội',          8, 4.82, 175, 77000.00, TRUE, TRUE, 'Chuyên vệ sinh công nghiệp và dọn dẹp tổng thể. Từng làm việc cho nhiều công ty dịch vụ lớn tại Hà Nội.'),
(22, '1992-04-03', 'female', '001092017890', '15 Quang Trung, P. Quang Trung, Hà Đông, Hà Nội',              5, 4.65, 110, 69000.00, TRUE, TRUE, 'Kinh nghiệm 5 năm chăm sóc người già và làm việc nhà. Nhẹ nhàng, kiên nhẫn và tận tụy với công việc.'),
(23, '1995-08-22', 'female', '001095018901', '23 Ngọc Hồi, P. Hoàng Liệt, Thanh Trì, Hà Nội',               3, 4.45, 70,  64000.00, TRUE, TRUE, 'Siêng năng, trung thực. Có kinh nghiệm dọn dẹp và nấu ăn cho hộ gia đình. Sẵn sàng làm thêm giờ khi cần.'),
(24, '1991-01-30', 'female', '001091019012', '67 Ngô Gia Tự, P. Đức Giang, Gia Lâm, Hà Nội',                 6, 4.78, 130, 74000.00, TRUE, TRUE, 'Chuyên giặt ủi và dọn dẹp nhà cửa. Làm việc tỉ mỉ, gọn gàng. Đã phục vụ nhiều gia đình lâu dài.'),
(25, '1989-09-11', 'female', '001089020123', '101 Xuân Nộn, TT. Đông Anh, Đông Anh, Hà Nội',                 7, 4.88, 165, 79000.00, TRUE, TRUE, 'Nhiều năm kinh nghiệm trong nghề. Chuyên dọn dẹp, nấu ăn và chăm sóc trẻ. Được nhiều gia đình đặt lịch định kỳ.');

-- 4. HELPER_SERVICES (Liên kết helper với service)

INSERT INTO helper_services (helper_id, service_id, experience_level, custom_price) VALUES
-- Helper 1 (Nguyễn Thị Mai)
(1, 1, 'expert', NULL),      -- Dọn dẹp
(1, 2, 'intermediate', NULL), -- Giặt ủi
(1, 3, 'expert', NULL),      -- Nấu ăn

-- Helper 2 (Trần Thị Lan)
(2, 1, 'intermediate', NULL), -- Dọn dẹp
(2, 2, 'expert', NULL),      -- Giặt ủi
(2, 4, 'intermediate', NULL), -- Chăm sóc trẻ

-- Helper 3 (Lê Thị Hương)
(3, 1, 'expert', NULL),      -- Dọn dẹp
(3, 6, 'expert', NULL),      -- Vệ sinh công nghiệp

-- Helper 4 (Phạm Thị Nga)
(4, 1, 'beginner', NULL),    -- Dọn dẹp
(4, 2, 'beginner', NULL),    -- Giặt ủi
(4, 3, 'intermediate', NULL), -- Nấu ăn

-- Helper 5 (Hoàng Thị Ly)
(5, 1, 'expert', NULL),      -- Dọn dẹp
(5, 2, 'intermediate', NULL), -- Giặt ủi
(5, 3, 'expert', NULL),      -- Nấu ăn

-- Helper 6 (Vũ Thị Thanh)
(6, 1, 'intermediate', NULL), -- Dọn dẹp
(6, 2, 'expert', NULL),      -- Giặt ủi
(6, 4, 'beginner', NULL),    -- Chăm sóc trẻ

-- Helper 7 (Đỗ Thị Hoa)
(7, 1, 'expert', NULL),      -- Dọn dẹp
(7, 3, 'expert', NULL),      -- Nấu ăn
(7, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 8 (Bùi Thị Linh)
(8, 4, 'intermediate', NULL), -- Chăm sóc trẻ
(8, 5, 'beginner', NULL),    -- Chăm sóc người già
(8, 1, 'beginner', NULL),    -- Dọn dẹp

-- Helper 9 (Dương Thị Phương)
(9, 1, 'expert', NULL),      -- Dọn dẹp
(9, 6, 'expert', NULL),      -- Vệ sinh công nghiệp
(9, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 10 (Ngô Thị Thảo)
(10, 1, 'beginner', NULL),   -- Dọn dẹp
(10, 2, 'beginner', NULL),   -- Giặt ủi
(10, 4, 'beginner', NULL),   -- Chăm sóc trẻ

-- Helper 11 (Đặng Thị Tuyết)
(11, 1, 'expert', NULL),     -- Dọn dẹp
(11, 3, 'expert', NULL),     -- Nấu ăn
(11, 5, 'intermediate', NULL), -- Chăm sóc người già

-- Helper 12 (Đinh Thị Thu Hà)
(12, 5, 'expert', NULL),     -- Chăm sóc người già
(12, 6, 'expert', NULL),     -- Vệ sinh công nghiệp
(12, 1, 'expert', NULL),     -- Dọn dẹp

-- Helper 13 (Lý Thị Bích Ngọc) — Hoàng Mai
(13, 1, 'intermediate', NULL), -- Dọn dẹp
(13, 2, 'expert', NULL),       -- Giặt ủi
(13, 3, 'intermediate', NULL), -- Nấu ăn

-- Helper 14 (Trịnh Thị Minh Châu) — Đống Đa
(14, 3, 'expert', NULL),       -- Nấu ăn
(14, 1, 'expert', NULL),       -- Dọn dẹp
(14, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 15 (Cao Thị Thu Thủy) — Tây Hồ
(15, 4, 'intermediate', NULL), -- Chăm sóc trẻ
(15, 1, 'beginner', NULL),     -- Dọn dẹp
(15, 2, 'beginner', NULL),     -- Giặt ủi

-- Helper 16 (Lưu Thị Hồng Nhung) — Nam Từ Liêm
(16, 6, 'expert', NULL),       -- Vệ sinh công nghiệp
(16, 1, 'expert', NULL),       -- Dọn dẹp
(16, 2, 'expert', NULL),       -- Giặt ủi

-- Helper 17 (Phùng Thị Diệu Linh) — Hà Đông
(17, 5, 'expert', NULL),       -- Chăm sóc người già
(17, 1, 'intermediate', NULL), -- Dọn dẹp
(17, 3, 'intermediate', NULL), -- Nấu ăn

-- Helper 18 (Tô Thị Bảo Trân) — Thanh Trì
(18, 1, 'intermediate', NULL), -- Dọn dẹp
(18, 3, 'beginner', NULL),     -- Nấu ăn
(18, 2, 'intermediate', NULL), -- Giặt ủi

-- Helper 19 (Quách Thị Mỹ Duyên) — Gia Lâm
(19, 2, 'expert', NULL),       -- Giặt ủi
(19, 1, 'expert', NULL),       -- Dọn dẹp
(19, 4, 'beginner', NULL),     -- Chăm sóc trẻ

-- Helper 20 (Mạc Thị Hải Yến) — Đông Anh
(20, 1, 'expert', NULL),       -- Dọn dẹp
(20, 3, 'expert', NULL),       -- Nấu ăn
(20, 4, 'intermediate', NULL); -- Chăm sóc trẻ

-- 5. SCHEDULES (Lịch làm việc của 12 helpers)

INSERT INTO schedules (helper_id, day_of_week, start_time, end_time, is_available) VALUES
-- Helper 1 (Nguyễn Thị Mai): Làm từ Thứ 2 đến Thứ 6
(1, 'monday', '08:00:00', '17:00:00', TRUE),
(1, 'tuesday', '08:00:00', '17:00:00', TRUE),
(1, 'wednesday', '08:00:00', '17:00:00', TRUE),
(1, 'thursday', '08:00:00', '17:00:00', TRUE),
(1, 'friday', '08:00:00', '17:00:00', TRUE),

-- Helper 2 (Trần Thị Lan): Làm cả tuần
(2, 'monday', '07:00:00', '18:00:00', TRUE),
(2, 'tuesday', '07:00:00', '18:00:00', TRUE),
(2, 'wednesday', '07:00:00', '18:00:00', TRUE),
(2, 'thursday', '07:00:00', '18:00:00', TRUE),
(2, 'friday', '07:00:00', '18:00:00', TRUE),
(2, 'saturday', '08:00:00', '16:00:00', TRUE),
(2, 'sunday', '08:00:00', '16:00:00', TRUE),

-- Helper 3 (Lê Thị Hương): Làm Thứ 2, 4, 6
(3, 'monday', '09:00:00', '18:00:00', TRUE),
(3, 'wednesday', '09:00:00', '18:00:00', TRUE),
(3, 'friday', '09:00:00', '18:00:00', TRUE),

-- Helper 4 (Phạm Thị Nga): Làm buổi sáng Thứ 2-6
(4, 'monday', '06:00:00', '12:00:00', TRUE),
(4, 'tuesday', '06:00:00', '12:00:00', TRUE),
(4, 'wednesday', '06:00:00', '12:00:00', TRUE),
(4, 'thursday', '06:00:00', '12:00:00', TRUE),
(4, 'friday', '06:00:00', '12:00:00', TRUE),

-- Helper 5 (Hoàng Thị Ly): Làm Thứ 2-6
(5, 'monday', '08:00:00', '17:00:00', TRUE),
(5, 'tuesday', '08:00:00', '17:00:00', TRUE),
(5, 'wednesday', '08:00:00', '17:00:00', TRUE),
(5, 'thursday', '08:00:00', '17:00:00', TRUE),
(5, 'friday', '08:00:00', '17:00:00', TRUE),

-- Helper 6 (Vũ Thị Thanh): Làm Thứ 3, 5, 7
(6, 'tuesday', '08:00:00', '17:00:00', TRUE),
(6, 'thursday', '08:00:00', '17:00:00', TRUE),
(6, 'saturday', '08:00:00', '17:00:00', TRUE),

-- Helper 7 (Đỗ Thị Hoa): Làm cả tuần
(7, 'monday', '07:30:00', '17:30:00', TRUE),
(7, 'tuesday', '07:30:00', '17:30:00', TRUE),
(7, 'wednesday', '07:30:00', '17:30:00', TRUE),
(7, 'thursday', '07:30:00', '17:30:00', TRUE),
(7, 'friday', '07:30:00', '17:30:00', TRUE),
(7, 'saturday', '09:00:00', '15:00:00', TRUE),
(7, 'sunday', '09:00:00', '15:00:00', TRUE),

-- Helper 8 (Bùi Thị Linh): Làm buổi chiều Thứ 2-6
(8, 'monday', '13:00:00', '19:00:00', TRUE),
(8, 'tuesday', '13:00:00', '19:00:00', TRUE),
(8, 'wednesday', '13:00:00', '19:00:00', TRUE),
(8, 'thursday', '13:00:00', '19:00:00', TRUE),
(8, 'friday', '13:00:00', '19:00:00', TRUE),

-- Helper 9 (Dương Thị Phương): Làm Thứ 2-6
(9, 'monday', '08:00:00', '18:00:00', TRUE),
(9, 'tuesday', '08:00:00', '18:00:00', TRUE),
(9, 'wednesday', '08:00:00', '18:00:00', TRUE),
(9, 'thursday', '08:00:00', '18:00:00', TRUE),
(9, 'friday', '08:00:00', '18:00:00', TRUE),

-- Helper 10 (Ngô Thị Thảo): Làm cuối tuần
(10, 'saturday', '08:00:00', '18:00:00', TRUE),
(10, 'sunday', '08:00:00', '18:00:00', TRUE),

-- Helper 11 (Đặng Thị Tuyết): Làm Thứ 2-6
(11, 'monday', '09:00:00', '17:00:00', TRUE),
(11, 'tuesday', '09:00:00', '17:00:00', TRUE),
(11, 'wednesday', '09:00:00', '17:00:00', TRUE),
(11, 'thursday', '09:00:00', '17:00:00', TRUE),
(11, 'friday', '09:00:00', '17:00:00', TRUE),

-- Helper 12 (Đinh Thị Thu Hà): Làm cả tuần
(12, 'monday', '06:00:00', '18:00:00', TRUE),
(12, 'tuesday', '06:00:00', '18:00:00', TRUE),
(12, 'wednesday', '06:00:00', '18:00:00', TRUE),
(12, 'thursday', '06:00:00', '18:00:00', TRUE),
(12, 'friday', '06:00:00', '18:00:00', TRUE),
(12, 'saturday', '07:00:00', '17:00:00', TRUE),
(12, 'sunday', '07:00:00', '17:00:00', TRUE),

-- Helper 13 (Lý Thị Bích Ngọc): Thứ 2–6
(13, 'monday', '08:00:00', '17:00:00', TRUE),
(13, 'tuesday', '08:00:00', '17:00:00', TRUE),
(13, 'wednesday', '08:00:00', '17:00:00', TRUE),
(13, 'thursday', '08:00:00', '17:00:00', TRUE),
(13, 'friday', '08:00:00', '17:00:00', TRUE),

-- Helper 14 (Trịnh Thị Minh Châu): Cả tuần
(14, 'monday', '07:00:00', '18:00:00', TRUE),
(14, 'tuesday', '07:00:00', '18:00:00', TRUE),
(14, 'wednesday', '07:00:00', '18:00:00', TRUE),
(14, 'thursday', '07:00:00', '18:00:00', TRUE),
(14, 'friday', '07:00:00', '18:00:00', TRUE),
(14, 'saturday', '08:00:00', '16:00:00', TRUE),
(14, 'sunday', '08:00:00', '16:00:00', TRUE),

-- Helper 15 (Cao Thị Thu Thủy): Thứ 2, 4, 6, 7
(15, 'monday', '09:00:00', '17:00:00', TRUE),
(15, 'wednesday', '09:00:00', '17:00:00', TRUE),
(15, 'friday', '09:00:00', '17:00:00', TRUE),
(15, 'saturday', '09:00:00', '17:00:00', TRUE),

-- Helper 16 (Lưu Thị Hồng Nhung): Thứ 2–6
(16, 'monday', '07:30:00', '17:30:00', TRUE),
(16, 'tuesday', '07:30:00', '17:30:00', TRUE),
(16, 'wednesday', '07:30:00', '17:30:00', TRUE),
(16, 'thursday', '07:30:00', '17:30:00', TRUE),
(16, 'friday', '07:30:00', '17:30:00', TRUE),

-- Helper 17 (Phùng Thị Diệu Linh): Thứ 2–6 buổi sáng
(17, 'monday', '06:00:00', '12:00:00', TRUE),
(17, 'tuesday', '06:00:00', '12:00:00', TRUE),
(17, 'wednesday', '06:00:00', '12:00:00', TRUE),
(17, 'thursday', '06:00:00', '12:00:00', TRUE),
(17, 'friday', '06:00:00', '12:00:00', TRUE),

-- Helper 18 (Tô Thị Bảo Trân): Thứ 3, 5, 7
(18, 'tuesday', '08:00:00', '17:00:00', TRUE),
(18, 'thursday', '08:00:00', '17:00:00', TRUE),
(18, 'saturday', '08:00:00', '17:00:00', TRUE),

-- Helper 19 (Quách Thị Mỹ Duyên): Thứ 2–6
(19, 'monday', '08:00:00', '18:00:00', TRUE),
(19, 'tuesday', '08:00:00', '18:00:00', TRUE),
(19, 'wednesday', '08:00:00', '18:00:00', TRUE),
(19, 'thursday', '08:00:00', '18:00:00', TRUE),
(19, 'friday', '08:00:00', '18:00:00', TRUE),

-- Helper 20 (Mạc Thị Hải Yến): Cả tuần
(20, 'monday', '06:00:00', '18:00:00', TRUE),
(20, 'tuesday', '06:00:00', '18:00:00', TRUE),
(20, 'wednesday', '06:00:00', '18:00:00', TRUE),
(20, 'thursday', '06:00:00', '18:00:00', TRUE),
(20, 'friday', '06:00:00', '18:00:00', TRUE),
(20, 'saturday', '07:00:00', '17:00:00', TRUE),
(20, 'sunday', '07:00:00', '17:00:00', TRUE);

-- 6. BOOKINGS (Lịch sử đặt dịch vụ)

INSERT INTO bookings (customer_id, helper_id, service_id, booking_date, start_time, end_time, hours, address, base_price, total_price, status, note) VALUES
-- Completed bookings (để test reviews)
(1, 1, 1, '2026-01-15', '09:00:00', '12:00:00', 3.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội', 360000.00, 360000.00, 'completed', 'Dọn dẹp nhà cửa tổng quát'),
(1, 2, 2, '2026-01-20', '14:00:00', '17:00:00', 3.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội', 315000.00, 315000.00, 'completed', 'Giặt ủi quần áo'),
(2, 3, 1, '2026-01-25', '08:00:00', '12:00:00', 4.00, '456 Trần Duy Hưng, P. Trung Hòa, Cầu Giấy, Hà Nội',  520000.00, 520000.00, 'completed', 'Dọn dẹp sau sửa nhà'),

-- In progress bookings
(3, 1, 3, '2026-03-12', '10:00:00', '13:00:00', 3.00, '789 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội',         390000.00, 390000.00, 'in_progress', 'Nấu cơm trưa'),
(4, 2, 1, '2026-03-12', '14:00:00', '16:00:00', 2.00, '321 Giải Phóng, P. Bách Khoa, Hai Bà Trưng, Hà Nội',  230000.00, 230000.00, 'in_progress', 'Dọn dẹp nhanh'),

-- Confirmed bookings (sắp diễn ra)
(1, 3, 6, '2026-03-15', '09:00:00', '17:00:00', 8.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội',1080000.00,1080000.00, 'confirmed', 'Vệ sinh tổng thể căn hộ'),
(2, 1, 1, '2026-03-17', '08:00:00', '11:00:00', 3.00, '456 Trần Duy Hưng, P. Trung Hòa, Cầu Giấy, Hà Nội',  360000.00, 360000.00, 'confirmed', 'Dọn dẹp hàng tuần'),

-- Pending bookings (chờ xác nhận)
(3, 4, 3, '2026-03-20', '11:00:00', '14:00:00', 3.00, '789 Láng Hạ, P. Thành Công, Ba Đình, Hà Nội',         360000.00, 360000.00, 'pending', 'Nấu ăn cho gia đình'),
(4, 2, 4, '2026-03-25', '08:00:00', '18:00:00', 10.00,'321 Giải Phóng, P. Bách Khoa, Hai Bà Trưng, Hà Nội', 1350000.00,1350000.00, 'pending', 'Chăm sóc trẻ cả ngày'),

-- Cancelled booking
(1, 1, 1, '2026-01-30', '09:00:00', '12:00:00', 3.00, '123 Nguyễn Trãi, P. Thượng Đình, Thanh Xuân, Hà Nội', 360000.00, 360000.00, 'cancelled', 'Khách hủy do có việc gấp');

-- 7. PAYMENTS (Tự động tạo qua trigger, nhưng update status)

-- Cập nhật payment status cho completed bookings
UPDATE payments SET payment_status = 'paid', paid_at = '2026-01-15 12:30:00' WHERE booking_id = 1;
UPDATE payments SET payment_status = 'paid', paid_at = '2026-01-20 17:30:00' WHERE booking_id = 2;
UPDATE payments SET payment_status = 'paid', paid_at = '2026-01-25 12:30:00' WHERE booking_id = 3;

-- In progress bookings: chưa thanh toán
-- booking_id 4, 5: payment_status = 'unpaid'

-- Confirmed bookings: chưa thanh toán
-- booking_id 6, 7: payment_status = 'unpaid'

-- Pending bookings: chưa thanh toán
-- booking_id 8, 9: payment_status = 'unpaid'

-- Cancelled booking: refund
UPDATE payments SET payment_status = 'refunded' WHERE booking_id = 10;

-- 8. REVIEWS (Chỉ review cho completed bookings)

INSERT INTO reviews (booking_id, customer_id, helper_id, rating, comment) VALUES
(1, 1, 1, 5, 'Chị Mai làm việc rất sạch sẽ và nhanh gọn. Tôi rất hài lòng!'),
(2, 1, 2, 4, 'Chị Lan giặt ủi khá tốt, tuy nhiên hơi lâu một chút.'),
(3, 2, 3, 5, 'Chị Hương làm việc chuyên nghiệp, nhà sạch bong như mới. Sẽ book lại!');

-- Cập nhật is_reviewed cho bookings đã đánh giá
UPDATE bookings SET is_reviewed = TRUE WHERE booking_id IN (1, 2, 3);

-- Trigger sẽ tự động cập nhật rating_average của helpers

-- KIỂM TRA DỮ LIỆU

-- Xem tổng số records (kỳ vọng: 25 users, 4 customers, 20 helpers, 6 services, 10 bookings, 3 reviews)
SELECT
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM customers) AS total_customers,
    (SELECT COUNT(*) FROM helpers) AS total_helpers,
    (SELECT COUNT(*) FROM services) AS total_services,
    (SELECT COUNT(*) FROM bookings) AS total_bookings,
    (SELECT COUNT(*) FROM reviews) AS total_reviews;

-- Xem danh sách helpers với rating
SELECT * FROM view_helpers_full ORDER BY rating_average DESC;

-- Xem danh sách bookings
SELECT * FROM view_bookings_detail ORDER BY booking_date DESC;

-- Xem thống kê helpers
SELECT * FROM view_helper_statistics ORDER BY rating_average DESC;

-- TEST STORED PROCEDURES

-- Test 1: Tính giá booking
-- Helper 1 (70k/h) + Service 1 (50k/h) × 3h = 360k
CALL calculate_booking_price(1, 1, 3, @price);
SELECT @price AS calculated_price;

-- Test 2: Kiểm tra availability
-- Helper 1 có available vào ngày 2026-02-20 từ 9h-12h không?
CALL check_helper_availability(1, '2026-02-20', '09:00:00', '12:00:00', @available);
SELECT @available AS is_helper_available;

-- Test 3: Kiểm tra conflict
-- Helper 1 đã có booking vào 2026-02-08, kiểm tra xem có conflict không
CALL check_helper_availability(1, '2026-02-08', '09:00:00', '12:00:00', @available);
SELECT @available AS has_conflict;

SELECT 'Dữ liệu mẫu đã được thêm thành công!' AS message;
