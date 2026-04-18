-- ============================================================
-- HỆ THỐNG SỐ HÓA DỊCH VỤ GIÚP VIỆC GIA ĐÌNH THEO GIỜ
-- Database Schema - Phiên bản đầy đủ
-- ============================================================

CREATE DATABASE IF NOT EXISTS housekeeping_service
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE housekeeping_service;

-- ============================================================
-- MODULE 1: NGƯỜI DÙNG & XÁC THỰC
-- ============================================================

CREATE TABLE users (
    user_id     INT AUTO_INCREMENT PRIMARY KEY,
    email       VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(15) UNIQUE NOT NULL,
    user_type   ENUM('customer', 'helper', 'admin') NOT NULL,
    avatar_url  VARCHAR(255) NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    last_seen_at TIMESTAMP NULL,                        -- Phục vụ hiển thị trạng thái online
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_last_seen (last_seen_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE customers (
    customer_id      INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNIQUE NOT NULL,
    address          TEXT NOT NULL,
    district         VARCHAR(50) NULL,
    city             VARCHAR(50) NOT NULL,
    preferred_payment ENUM('cash', 'bank_transfer', 'e_wallet') DEFAULT 'cash',
    loyalty_points   INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE helpers (
    helper_id        INT AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNIQUE NOT NULL,
    date_of_birth    DATE NOT NULL,
    gender           ENUM('male', 'female', 'other') NOT NULL,
    id_card_number   VARCHAR(20) UNIQUE NOT NULL,
    address          TEXT NOT NULL,
    experience_years INT DEFAULT 0,
    rating_average   DECIMAL(3,2) DEFAULT 0.00,
    total_bookings   INT DEFAULT 0,
    hourly_rate      DECIMAL(10,2) NOT NULL,
    is_verified      BOOLEAN DEFAULT FALSE,
    is_available     BOOLEAN DEFAULT TRUE,
    bio              TEXT NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_rating (rating_average),
    INDEX idx_hourly_rate (hourly_rate),
    INDEX idx_is_available (is_available),
    CONSTRAINT chk_rating CHECK (rating_average >= 0 AND rating_average <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 2: DỊCH VỤ & ĐẶT LỊCH
-- ============================================================

CREATE TABLE services (
    service_id   INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL,
    description  TEXT NULL,
    base_price   DECIMAL(10,2) NOT NULL,
    icon_url     VARCHAR(255) NULL,
    -- Slug phục vụ SEO cho trang dịch vụ
    slug         VARCHAR(150) UNIQUE NULL,
    is_active    BOOLEAN DEFAULT TRUE,
    INDEX idx_service_name (service_name),
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE helper_services (
    helper_service_id INT AUTO_INCREMENT PRIMARY KEY,
    helper_id         INT NOT NULL,
    service_id        INT NOT NULL,
    experience_level  ENUM('beginner', 'intermediate', 'expert') NOT NULL,
    custom_price      DECIMAL(10,2) NULL,
    FOREIGN KEY (helper_id) REFERENCES helpers(helper_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    UNIQUE KEY unique_helper_service (helper_id, service_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE schedules (
    schedule_id  INT AUTO_INCREMENT PRIMARY KEY,
    helper_id    INT NOT NULL,
    day_of_week  ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
    start_time   TIME NOT NULL,
    end_time     TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (helper_id) REFERENCES helpers(helper_id) ON DELETE CASCADE,
    INDEX idx_helper_schedule (helper_id, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE bookings (
    booking_id     INT AUTO_INCREMENT PRIMARY KEY,
    customer_id    INT NOT NULL,
    helper_id      INT NOT NULL,
    service_id     INT NOT NULL,
    promo_id       INT NULL,                            -- Liên kết khuyến mãi (nếu có)
    booking_date   DATE NOT NULL,
    start_time     TIME NOT NULL,
    end_time       TIME NOT NULL,
    hours          DECIMAL(4,2) NOT NULL,
    address        TEXT NOT NULL,
    base_price     DECIMAL(10,2) NOT NULL,              -- Giá trước khuyến mãi
    discount_amount DECIMAL(10,2) DEFAULT 0.00,         -- Số tiền được giảm
    total_price    DECIMAL(10,2) NOT NULL,              -- Giá sau khuyến mãi
    status         ENUM('pending','confirmed','in_progress','completed','cancelled') DEFAULT 'pending',
    checkin_at     TIMESTAMP NULL,                      -- Thời điểm helper check-in
    checkout_at    TIMESTAMP NULL,                      -- Thời điểm helper check-out
    note           TEXT NULL,
    is_reviewed    BOOLEAN DEFAULT FALSE,                  -- Đã được customer đánh giá chưa
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (helper_id) REFERENCES helpers(helper_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
    INDEX idx_booking_date (booking_date),
    INDEX idx_status (status),
    INDEX idx_customer (customer_id),
    INDEX idx_helper (helper_id),
    CONSTRAINT chk_hours CHECK (hours > 0),
    CONSTRAINT chk_price CHECK (total_price >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Lịch sử trạng thái booking (Matching log & Check-in/out log)
CREATE TABLE booking_logs (
    log_id       INT AUTO_INCREMENT PRIMARY KEY,
    booking_id   INT NOT NULL,
    changed_by   INT NOT NULL,                          -- user_id của người thực hiện thay đổi
    old_status   ENUM('pending','confirmed','in_progress','completed','cancelled') NULL,
    new_status   ENUM('pending','confirmed','in_progress','completed','cancelled') NOT NULL,
    note         VARCHAR(255) NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(user_id),
    INDEX idx_booking_log (booking_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE payments (
    payment_id     INT AUTO_INCREMENT PRIMARY KEY,
    booking_id     INT UNIQUE NOT NULL,
    amount         DECIMAL(10,2) NOT NULL,
    payment_method ENUM('cash','bank_transfer','e_wallet') NOT NULL,
    payment_status ENUM('unpaid','paid','refunded') DEFAULT 'unpaid',
    transaction_id VARCHAR(100) NULL,
    paid_at        TIMESTAMP NULL,
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    INDEX idx_payment_status (payment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE reviews (
    review_id   INT AUTO_INCREMENT PRIMARY KEY,
    booking_id  INT UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    helper_id   INT NOT NULL,
    rating      INT NOT NULL,
    comment     TEXT NULL,
    is_visible  BOOLEAN DEFAULT TRUE,                   -- Admin có thể ẩn review vi phạm
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (helper_id) REFERENCES helpers(helper_id) ON DELETE CASCADE,
    INDEX idx_helper_rating (helper_id, rating),
    CONSTRAINT chk_rating_value CHECK (rating >= 1 AND rating <= 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 3: HỆ THỐNG KHUYẾN MÃI
-- ============================================================

CREATE TABLE promotions (
    promo_id        INT AUTO_INCREMENT PRIMARY KEY,
    code            VARCHAR(50) UNIQUE NOT NULL,
    title           VARCHAR(150) NOT NULL,
    description     TEXT NULL,
    -- 'percentage' giảm theo %, 'fixed' giảm số tiền cố định
    discount_type   ENUM('percentage', 'fixed') NOT NULL,
    discount_value  DECIMAL(10,2) NOT NULL,
    -- Giá trị đơn hàng tối thiểu để áp dụng
    min_order_value DECIMAL(10,2) DEFAULT 0.00,
    -- Số tiền giảm tối đa (áp dụng cho discount_type = 'percentage')
    max_discount    DECIMAL(10,2) NULL,
    max_uses        INT NULL,                           -- NULL = không giới hạn số lần dùng
    used_count      INT DEFAULT 0,
    -- Giới hạn mỗi user chỉ dùng N lần
    max_uses_per_user INT DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    created_by      INT NOT NULL,                       -- admin tạo
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id),
    INDEX idx_code (code),
    INDEX idx_active_date (is_active, start_date, end_date),
    CONSTRAINT chk_promo_value CHECK (discount_value > 0),
    CONSTRAINT chk_promo_date CHECK (end_date >= start_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm FK cho bookings.promo_id sau khi bảng promotions đã tạo
ALTER TABLE bookings ADD CONSTRAINT fk_booking_promo
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id) ON DELETE SET NULL;

CREATE TABLE promotion_usage (
    usage_id    INT AUTO_INCREMENT PRIMARY KEY,
    promo_id    INT NOT NULL,
    user_id     INT NOT NULL,
    booking_id  INT NOT NULL,
    used_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (promo_id) REFERENCES promotions(promo_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE,
    UNIQUE KEY unique_promo_booking (promo_id, booking_id),
    INDEX idx_promo_user (promo_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 4: HỆ THỐNG CHAT TRỰC TUYẾN
-- ============================================================

-- Một cuộc hội thoại giữa 2 user (customer-helper hoặc user-admin)
CREATE TABLE conversations (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY,
    -- Booking liên quan (nếu chat về một đơn cụ thể)
    booking_id      INT NULL,
    -- Hai thành viên cố định của cuộc hội thoại
    participant_one INT NOT NULL,
    participant_two INT NOT NULL,
    last_message_at TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
    FOREIGN KEY (participant_one) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (participant_two) REFERENCES users(user_id) ON DELETE CASCADE,
    -- Mỗi cặp user chỉ có 1 cuộc hội thoại (không tính booking)
    UNIQUE KEY unique_conversation (participant_one, participant_two),
    INDEX idx_participant (participant_one, participant_two),
    INDEX idx_last_message (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
    message_id      INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id       INT NOT NULL,
    content         TEXT NOT NULL,
    -- Loại nội dung: text, image, file
    message_type    ENUM('text', 'image', 'file') DEFAULT 'text',
    file_url        VARCHAR(500) NULL,                  -- Đường dẫn file/ảnh nếu có
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP NULL,
    is_deleted      BOOLEAN DEFAULT FALSE,              -- Xóa mềm
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_conversation_time (conversation_id, created_at),
    INDEX idx_unread (conversation_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 5: THÔNG BÁO THỜI GIAN THỰC
-- ============================================================

CREATE TABLE notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    title           VARCHAR(200) NOT NULL,
    body            TEXT NOT NULL,
    -- Phân loại thông báo để hiển thị icon phù hợp
    type            ENUM(
                        'booking_new',
                        'booking_confirmed',
                        'booking_cancelled',
                        'booking_completed',
                        'checkin',
                        'checkout',
                        'payment_success',
                        'new_review',
                        'new_message',
                        'promo',
                        'system'
                    ) NOT NULL,
    -- Dữ liệu bổ sung dạng JSON (vd: {"booking_id": 5})
    data            JSON NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    read_at         TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, is_read, created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 6: BLOG & SEO
-- ============================================================

CREATE TABLE blog_categories (
    category_id   INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    slug          VARCHAR(120) UNIQUE NOT NULL,
    description   TEXT NULL,
    is_active     BOOLEAN DEFAULT TRUE,
    sort_order    INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blog_posts (
    post_id           INT AUTO_INCREMENT PRIMARY KEY,
    category_id       INT NOT NULL,
    author_id         INT NOT NULL,                     -- user_id của admin/editor
    title             VARCHAR(200) NOT NULL,
    slug              VARCHAR(220) UNIQUE NOT NULL,     -- URL thân thiện SEO
    excerpt           TEXT NULL,                        -- Tóm tắt ngắn
    content           LONGTEXT NOT NULL,
    thumbnail_url     VARCHAR(500) NULL,
    -- Các trường SEO
    meta_title        VARCHAR(70) NULL,
    meta_description  VARCHAR(160) NULL,
    meta_keywords     VARCHAR(255) NULL,
    -- Canonical URL tránh duplicate content
    canonical_url     VARCHAR(500) NULL,
    status            ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    is_featured       BOOLEAN DEFAULT FALSE,            -- Bài viết nổi bật
    view_count        INT DEFAULT 0,
    published_at      TIMESTAMP NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES blog_categories(category_id) ON DELETE RESTRICT,
    FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    INDEX idx_slug (slug),
    INDEX idx_status_date (status, published_at),
    INDEX idx_featured (is_featured, status),
    FULLTEXT INDEX ft_search (title, excerpt, content)  -- Full-text search
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blog_tags (
    tag_id     INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(50) NOT NULL,
    slug       VARCHAR(60) UNIQUE NOT NULL,
    INDEX idx_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blog_post_tags (
    post_id INT NOT NULL,
    tag_id  INT NOT NULL,
    PRIMARY KEY (post_id, tag_id),
    FOREIGN KEY (post_id) REFERENCES blog_posts(post_id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES blog_tags(tag_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 7: XÁC THỰC HELPER (KYC)
-- ============================================================

CREATE TABLE helper_documents (
    document_id   INT AUTO_INCREMENT PRIMARY KEY,
    helper_id     INT NOT NULL,
    -- Loại giấy tờ: CCCD, bằng cấp, chứng chỉ, hình ảnh cá nhân
    document_type ENUM('id_card_front', 'id_card_back', 'certificate', 'profile_photo') NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    -- Trạng thái xét duyệt của từng giấy tờ
    status        ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    -- Ghi chú lý do từ chối (nếu rejected)
    admin_note    VARCHAR(255) NULL,
    reviewed_by   INT NULL,                             -- user_id của admin đã xét duyệt
    reviewed_at   TIMESTAMP NULL,
    uploaded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (helper_id) REFERENCES helpers(helper_id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    -- Mỗi helper chỉ có 1 bản active cho mỗi loại giấy tờ
    UNIQUE KEY unique_helper_doc_type (helper_id, document_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- MODULE 8: VÍ ĐIỆN TỬ (WALLET)
-- ============================================================

-- Mỗi user (helper hoặc customer) có 1 ví
CREATE TABLE wallets (
    wallet_id   INT AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNIQUE NOT NULL,
    balance     DECIMAL(12,2) DEFAULT 0.00,
    -- Tổng tiền đã kiếm được / đã nạp (không trừ rút)
    total_earned DECIMAL(12,2) DEFAULT 0.00,
    -- Tổng tiền đã rút / đã chi
    total_withdrawn DECIMAL(12,2) DEFAULT 0.00,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT chk_balance CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE wallet_transactions (
    transaction_id  INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id       INT NOT NULL,
    -- 'credit' = tiền vào, 'debit' = tiền ra
    type            ENUM('credit', 'debit') NOT NULL,
    amount          DECIMAL(12,2) NOT NULL,
    -- Số dư sau giao dịch này (snapshot)
    balance_after   DECIMAL(12,2) NOT NULL,
    -- Phân loại nguồn giao dịch
    source          ENUM(
                        'booking_payment',   -- Nhận tiền từ đơn hoàn thành
                        'withdrawal',        -- Rút tiền ra ngân hàng
                        'top_up',            -- Nạp tiền vào ví
                        'refund',            -- Hoàn tiền đơn hủy
                        'bonus'              -- Thưởng/khuyến mãi từ admin
                    ) NOT NULL,
    -- Liên kết đơn hàng liên quan (nếu có)
    booking_id      INT NULL,
    description     VARCHAR(255) NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id) ON DELETE CASCADE,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE SET NULL,
    INDEX idx_wallet_time (wallet_id, created_at),
    INDEX idx_source (source),
    CONSTRAINT chk_tx_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TRIGGERS
-- ============================================================

DELIMITER $$

-- Tự động cập nhật rating trung bình của helper sau khi có review mới
CREATE TRIGGER trg_update_helper_rating
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE helpers
    SET rating_average = (
        SELECT AVG(rating) FROM reviews
        WHERE helper_id = NEW.helper_id AND is_visible = TRUE
    )
    WHERE helper_id = NEW.helper_id;
END$$

-- Tăng total_bookings của helper khi booking hoàn thành
CREATE TRIGGER trg_increment_helper_bookings
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        UPDATE helpers
        SET total_bookings = total_bookings + 1
        WHERE helper_id = NEW.helper_id;
    END IF;
END$$

-- Tự động tạo bản ghi payment khi booking được tạo
CREATE TRIGGER trg_create_payment_after_booking
AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
    INSERT INTO payments (booking_id, amount, payment_method, payment_status)
    VALUES (NEW.booking_id, NEW.total_price, 'cash', 'unpaid');
END$$

-- Tự động ghi log khi trạng thái booking thay đổi
CREATE TRIGGER trg_log_booking_status
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status)
        VALUES (NEW.booking_id, NEW.helper_id, OLD.status, NEW.status);
    END IF;
END$$

-- Cập nhật used_count của mã khuyến mãi sau khi có usage mới
CREATE TRIGGER trg_increment_promo_usage
AFTER INSERT ON promotion_usage
FOR EACH ROW
BEGIN
    UPDATE promotions
    SET used_count = used_count + 1
    WHERE promo_id = NEW.promo_id;
END$$

-- Cập nhật last_message_at của conversation khi có tin nhắn mới
CREATE TRIGGER trg_update_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW
BEGIN
    UPDATE conversations
    SET last_message_at = NEW.created_at
    WHERE conversation_id = NEW.conversation_id;
END$$

-- Ràng buộc checkout_at phải sau checkin_at khi cập nhật booking
CREATE TRIGGER trg_validate_checkinout
BEFORE UPDATE ON bookings
FOR EACH ROW
BEGIN
    -- Chỉ kiểm tra khi cả 2 trường đều có giá trị
    IF NEW.checkout_at IS NOT NULL AND NEW.checkin_at IS NOT NULL THEN
        IF NEW.checkout_at <= NEW.checkin_at THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'checkout_at phải sau checkin_at';
        END IF;
    END IF;
    -- Không cho phép set checkout_at khi chưa có checkin_at
    IF NEW.checkout_at IS NOT NULL AND NEW.checkin_at IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Phải check-in trước khi check-out';
    END IF;
END$$

-- Tự động tạo ví khi tạo user mới (helper hoặc customer)
CREATE TRIGGER trg_create_wallet_for_user
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    IF NEW.user_type IN ('helper', 'customer') THEN
        INSERT INTO wallets (user_id) VALUES (NEW.user_id);
    END IF;
END$$

-- Cập nhật số dư ví và tổng thống kê sau mỗi giao dịch
CREATE TRIGGER trg_update_wallet_balance
AFTER INSERT ON wallet_transactions
FOR EACH ROW
BEGIN
    IF NEW.type = 'credit' THEN
        UPDATE wallets
        SET balance       = balance + NEW.amount,
            total_earned  = total_earned + NEW.amount
        WHERE wallet_id = NEW.wallet_id;
    ELSE
        UPDATE wallets
        SET balance          = balance - NEW.amount,
            total_withdrawn  = total_withdrawn + NEW.amount
        WHERE wallet_id = NEW.wallet_id;
    END IF;
END$$

-- Tự động cập nhật trạng thái KYC của helper khi tất cả giấy tờ được duyệt
CREATE TRIGGER trg_auto_verify_helper
AFTER UPDATE ON helper_documents
FOR EACH ROW
BEGIN
    DECLARE v_pending_count INT;

    IF NEW.status = 'approved' THEN
        -- Đếm số giấy tờ còn pending hoặc rejected của helper này
        SELECT COUNT(*) INTO v_pending_count
        FROM helper_documents
        WHERE helper_id = NEW.helper_id
          AND status != 'approved';

        IF v_pending_count = 0 THEN
            UPDATE helpers SET is_verified = TRUE
            WHERE helper_id = NEW.helper_id;
        END IF;
    END IF;

    -- Nếu bị reject, bỏ verified
    IF NEW.status = 'rejected' THEN
        UPDATE helpers SET is_verified = FALSE
        WHERE helper_id = NEW.helper_id;
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- STORED PROCEDURES
-- ============================================================

DELIMITER $$

-- Tính giá booking (có tích hợp kiểm tra khuyến mãi)
CREATE PROCEDURE sp_calculate_booking_price(
    IN  p_helper_id    INT,
    IN  p_service_id   INT,
    IN  p_hours        DECIMAL(4,2),
    IN  p_promo_code   VARCHAR(50),
    OUT p_base_price   DECIMAL(10,2),
    OUT p_discount     DECIMAL(10,2),
    OUT p_total_price  DECIMAL(10,2),
    OUT p_promo_id     INT
)
BEGIN
    DECLARE v_helper_rate   DECIMAL(10,2);
    DECLARE v_service_price DECIMAL(10,2);
    DECLARE v_disc_type     ENUM('percentage','fixed');
    DECLARE v_disc_value    DECIMAL(10,2);
    DECLARE v_max_disc      DECIMAL(10,2);
    DECLARE v_min_order     DECIMAL(10,2);

    -- Lấy giá của helper
    SELECT hourly_rate INTO v_helper_rate
    FROM helpers WHERE helper_id = p_helper_id;

    -- Lấy giá cơ bản của dịch vụ
    SELECT base_price INTO v_service_price
    FROM services WHERE service_id = p_service_id;

    -- Tính giá gốc: (giá helper + giá dịch vụ) × số giờ
    SET p_base_price  = (v_helper_rate + v_service_price) * p_hours;
    SET p_discount    = 0.00;
    SET p_promo_id    = NULL;

    -- Xử lý mã khuyến mãi nếu được cung cấp
    IF p_promo_code IS NOT NULL AND p_promo_code != '' THEN
        SELECT promo_id, discount_type, discount_value, max_discount, min_order_value
        INTO   p_promo_id, v_disc_type, v_disc_value, v_max_disc, v_min_order
        FROM   promotions
        WHERE  code = p_promo_code
          AND  is_active = TRUE
          AND  CURDATE() BETWEEN start_date AND end_date
          AND  (max_uses IS NULL OR used_count < max_uses);

        IF p_promo_id IS NOT NULL AND p_base_price >= v_min_order THEN
            IF v_disc_type = 'percentage' THEN
                SET p_discount = ROUND(p_base_price * v_disc_value / 100, 2);
                -- Giới hạn số tiền giảm tối đa
                IF v_max_disc IS NOT NULL AND p_discount > v_max_disc THEN
                    SET p_discount = v_max_disc;
                END IF;
            ELSE
                SET p_discount = v_disc_value;
            END IF;
        ELSE
            SET p_promo_id = NULL;
        END IF;
    END IF;

    SET p_total_price = GREATEST(p_base_price - p_discount, 0);
END$$

-- Kiểm tra helper có lịch trống trong khoảng thời gian không
CREATE PROCEDURE sp_check_helper_availability(
    IN  p_helper_id    INT,
    IN  p_booking_date DATE,
    IN  p_start_time   TIME,
    IN  p_end_time     TIME,
    OUT p_is_available BOOLEAN
)
BEGIN
    DECLARE v_conflict INT;

    SELECT COUNT(*) INTO v_conflict
    FROM bookings
    WHERE helper_id    = p_helper_id
      AND booking_date = p_booking_date
      AND status NOT IN ('cancelled', 'completed')
      AND (
          (start_time <= p_start_time AND end_time > p_start_time)
          OR (start_time < p_end_time  AND end_time >= p_end_time)
          OR (start_time >= p_start_time AND end_time <= p_end_time)
      );

    IF v_conflict = 0 THEN
        SELECT is_available INTO p_is_available
        FROM helpers WHERE helper_id = p_helper_id;
    ELSE
        SET p_is_available = FALSE;
    END IF;
END$$

-- Đánh dấu tất cả thông báo của user là đã đọc
CREATE PROCEDURE sp_mark_all_notifications_read(IN p_user_id INT)
BEGIN
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND is_read = FALSE;
END$$

-- Rút tiền từ ví: kiểm tra số dư trước, dùng Transaction để đảm bảo toàn vẹn
CREATE PROCEDURE sp_wallet_withdraw(
    IN  p_user_id    INT,
    IN  p_amount     DECIMAL(12,2),
    IN  p_description VARCHAR(255),
    OUT p_success    BOOLEAN,
    OUT p_message    VARCHAR(255)
)
BEGIN
    DECLARE v_wallet_id  INT;
    DECLARE v_balance    DECIMAL(12,2);
    DECLARE v_balance_after DECIMAL(12,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Lỗi hệ thống, vui lòng thử lại';
    END;

    START TRANSACTION;

    -- Khóa dòng ví để tránh race condition
    SELECT wallet_id, balance INTO v_wallet_id, v_balance
    FROM wallets WHERE user_id = p_user_id FOR UPDATE;

    IF v_balance < p_amount THEN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Số dư không đủ';
    ELSE
        SET v_balance_after = v_balance - p_amount;

        INSERT INTO wallet_transactions
            (wallet_id, type, amount, balance_after, source, description)
        VALUES
            (v_wallet_id, 'debit', p_amount, v_balance_after, 'withdrawal', p_description);

        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Rút tiền thành công';
    END IF;
END$$

DELIMITER ;

-- ============================================================
-- VIEWS
-- ============================================================

-- Danh sách helper với thông tin đầy đủ
CREATE VIEW view_helpers_full AS
SELECT
    h.helper_id,
    u.full_name,
    u.phone,
    u.email,
    u.avatar_url,
    h.gender,
    h.experience_years,
    h.rating_average,
    h.total_bookings,
    h.hourly_rate,
    h.is_verified,
    h.is_available,
    h.bio
FROM helpers h
INNER JOIN users u ON h.user_id = u.user_id
WHERE u.is_active = TRUE;

-- Chi tiết booking (bao gồm thông tin khuyến mãi)
CREATE VIEW view_bookings_detail AS
SELECT
    b.booking_id,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.hours,
    b.base_price,
    b.discount_amount,
    b.total_price,
    b.status,
    b.checkin_at,
    b.checkout_at,
    c_user.full_name  AS customer_name,
    c_user.phone      AS customer_phone,
    h_user.full_name  AS helper_name,
    h_user.phone      AS helper_phone,
    s.service_name,
    p.payment_status,
    pr.code           AS promo_code,
    b.created_at
FROM bookings b
INNER JOIN customers c    ON b.customer_id = c.customer_id
INNER JOIN users c_user   ON c.user_id     = c_user.user_id
INNER JOIN helpers h      ON b.helper_id   = h.helper_id
INNER JOIN users h_user   ON h.user_id     = h_user.user_id
INNER JOIN services s     ON b.service_id  = s.service_id
LEFT  JOIN payments p     ON b.booking_id  = p.booking_id
LEFT  JOIN promotions pr  ON b.promo_id    = pr.promo_id;

-- Thống kê helper
CREATE VIEW view_helper_statistics AS
SELECT
    h.helper_id,
    u.full_name,
    h.rating_average,
    h.total_bookings,
    COUNT(DISTINCT hs.service_id) AS total_services,
    h.hourly_rate,
    h.is_available
FROM helpers h
INNER JOIN users u ON h.user_id = u.user_id
LEFT  JOIN helper_services hs ON h.helper_id = hs.helper_id
GROUP BY h.helper_id, u.full_name, h.rating_average, h.total_bookings, h.hourly_rate, h.is_available;

-- Danh sách bài viết blog đã publish kèm thông tin tác giả và danh mục
CREATE VIEW view_blog_posts_published AS
SELECT
    bp.post_id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.thumbnail_url,
    bp.meta_title,
    bp.meta_description,
    bp.view_count,
    bp.is_featured,
    bp.published_at,
    bc.name  AS category_name,
    bc.slug  AS category_slug,
    u.full_name AS author_name
FROM blog_posts bp
INNER JOIN blog_categories bc ON bp.category_id = bc.category_id
INNER JOIN users u            ON bp.author_id   = u.user_id
WHERE bp.status = 'published';

-- Số dư ví của từng user kèm thông tin cơ bản
CREATE VIEW view_wallet_summary AS
SELECT
    w.wallet_id,
    w.user_id,
    u.full_name,
    u.user_type,
    w.balance,
    w.total_earned,
    w.total_withdrawn,
    w.updated_at
FROM wallets w
INNER JOIN users u ON w.user_id = u.user_id;

-- Danh sách giấy tờ KYC của helper kèm trạng thái
CREATE VIEW view_helper_kyc_status AS
SELECT
    h.helper_id,
    u.full_name,
    h.is_verified,
    MAX(CASE WHEN hd.document_type = 'id_card_front'  THEN hd.status END) AS id_card_front_status,
    MAX(CASE WHEN hd.document_type = 'id_card_back'   THEN hd.status END) AS id_card_back_status,
    MAX(CASE WHEN hd.document_type = 'certificate'    THEN hd.status END) AS certificate_status,
    MAX(CASE WHEN hd.document_type = 'profile_photo'  THEN hd.status END) AS profile_photo_status
FROM helpers h
INNER JOIN users u ON h.user_id = u.user_id
LEFT  JOIN helper_documents hd ON h.helper_id = hd.helper_id
GROUP BY h.helper_id, u.full_name, h.is_verified;

-- ============================================================
-- COMPOSITE INDEXES CHO QUERY PHỔ BIẾN
-- ============================================================

CREATE INDEX idx_bookings_helper_date   ON bookings(helper_id, booking_date, status);
CREATE INDEX idx_bookings_customer_date ON bookings(customer_id, booking_date, status);
CREATE INDEX idx_reviews_helper_rating  ON reviews(helper_id, rating);
CREATE INDEX idx_messages_conv_time     ON messages(conversation_id, created_at, is_deleted);
CREATE INDEX idx_notif_user_time        ON notifications(user_id, created_at, is_read);
CREATE INDEX idx_blog_category_status   ON blog_posts(category_id, status, published_at);
CREATE INDEX idx_wallet_tx_wallet_time  ON wallet_transactions(wallet_id, created_at);
CREATE INDEX idx_helper_docs_status     ON helper_documents(helper_id, status);

-- ============================================================
-- DỮ LIỆU MẪU
-- ============================================================

INSERT INTO services (service_name, slug, description, base_price, is_active) VALUES
('Dọn dẹp nhà cửa',   'don-dep-nha-cua',   'Quét nhà, lau nhà, sắp xếp đồ đạc',   50000.00, TRUE),
('Giặt ủi',           'giat-ui',            'Giặt và ủi quần áo',                   40000.00, TRUE),
('Nấu ăn',            'nau-an',             'Nấu các bữa ăn gia đình',              60000.00, TRUE),
('Chăm sóc trẻ em',   'cham-soc-tre-em',   'Trông trẻ, cho ăn, học bài',           70000.00, TRUE),
('Chăm sóc người già','cham-soc-nguoi-gia','Chăm sóc, hỗ trợ sinh hoạt',           80000.00, TRUE),
('Vệ sinh công nghiệp','ve-sinh-cong-nghiep','Vệ sinh văn phòng, nhà xưởng',        55000.00, TRUE);

INSERT INTO blog_categories (name, slug, description, is_active) VALUES
('Mẹo vặt gia đình',   'meo-vat-gia-dinh',  'Các mẹo hữu ích cho công việc nhà',   TRUE),
('Tin tức',            'tin-tuc',            'Cập nhật tin tức mới nhất',            TRUE),
('Hướng dẫn',          'huong-dan',          'Hướng dẫn sử dụng dịch vụ',           TRUE);
