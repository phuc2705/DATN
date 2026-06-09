// Model User - tất cả truy vấn liên quan đến bảng users, customers, helpers
const { pool } = require('../config/database');

const UserModel = {
  // Tìm user theo email - chỉ trả về tài khoản đã kích hoạt (dùng khi đăng nhập)
  findByEmail: async (email) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    return rows[0] || null;
  },

  // Tìm user theo email bất kể trạng thái kích hoạt (dùng khi kiểm tra đăng ký)
  findByEmailAny: async (email) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  // Kích hoạt tài khoản sau khi xác minh OTP thành công
  activateUser: async (email) => {
    await pool.query('UPDATE users SET is_active = 1 WHERE email = ?', [email]);
  },

  // Xóa tài khoản chưa kích hoạt để cho phép đăng ký lại
  deleteInactiveByEmail: async (email) => {
    await pool.query('DELETE FROM users WHERE email = ? AND is_active = 0', [email]);
  },

  // Xóa tài khoản chưa kích hoạt có cùng số điện thoại (tránh duplicate phone khi đăng ký lại)
  deleteInactiveByPhone: async (phone) => {
    await pool.query('DELETE FROM users WHERE phone = ? AND is_active = 0', [phone]);
  },

  // Xóa toàn bộ tài khoản theo email (chỉ dùng cho email test, xem TEST_EMAILS trong .env)
  deleteByEmail: async (email) => {
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
  },

  // Cập nhật mật khẩu mới sau khi đặt lại (reset password)
  updatePassword: async (email, passwordHash) => {
    await pool.query(
      'UPDATE users SET password_hash = ? WHERE email = ? AND is_active = 1',
      [passwordHash, email]
    );
  },

  // Tìm user theo ID
  findById: async (userId) => {
    const [rows] = await pool.query(
      'SELECT user_id, email, full_name, phone, user_type, avatar_url, is_active, created_at FROM users WHERE user_id = ?',
      [userId]
    );
    return rows[0] || null;
  },

  // Tạo user mới (dùng Transaction để đảm bảo toàn vẹn khi thêm cả customer/helper)
  createCustomer: async ({ email, passwordHash, fullName, phone, address, district, city }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Tạo bản ghi trong bảng users với is_active = 0 (chờ xác minh OTP)
      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, full_name, phone, user_type, is_active) VALUES (?, ?, ?, ?, 'customer', 0)`,
        [email, passwordHash, fullName, phone]
      );
      const userId = userResult.insertId;

      // Tạo bản ghi trong bảng customers — requires_deposit=1 vì đây là tài khoản mới
      await connection.query(
        'INSERT INTO customers (user_id, address, district, city, requires_deposit) VALUES (?, ?, ?, ?, 1)',
        [userId, address, district, city]
      );

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Đăng ký tài khoản Helper
  createHelper: async ({ email, passwordHash, fullName, phone, dateOfBirth, gender, idCardNumber, address, bio, avatarUrl, pendingServiceIds }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, full_name, phone, user_type, is_active, avatar_url) VALUES (?, ?, ?, ?, 'helper', 0, ?)`,
        [email, passwordHash, fullName, phone, avatarUrl || null]
      );
      const userId = userResult.insertId;

      // Lưu danh sách dịch vụ đăng ký dưới dạng JSON — sẽ được insert vào helper_services khi admin duyệt
      const serviceIdsJson = pendingServiceIds?.length
        ? JSON.stringify(pendingServiceIds.map(Number))
        : null;

      await connection.query(
        `INSERT INTO helpers (user_id, date_of_birth, gender, id_card_number, address, bio, pending_service_ids)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, dateOfBirth, gender, idCardNumber, address, bio || null, serviceIdsJson]
      );

      await connection.commit();
      return userId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Lấy thông tin chi tiết customer (join với users)
  getCustomerProfile: async (userId) => {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.full_name, u.phone, u.avatar_url, u.created_at,
              u.user_type, u.is_active,
              c.customer_id, c.address, c.district, c.city, c.preferred_payment, c.loyalty_points
       FROM users u
       JOIN customers c ON u.user_id = c.user_id
       WHERE u.user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // Lấy thông tin chi tiết helper (join với users)
  getHelperProfile: async (userId) => {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.full_name, u.phone, u.avatar_url, u.created_at,
              u.user_type, u.is_active,
              h.helper_id, h.date_of_birth, h.gender, h.experience_years, h.rating_average,
              h.total_bookings, h.hourly_rate, h.is_verified, h.is_available, h.bio
       FROM users u
       JOIN helpers h ON u.user_id = h.user_id
       WHERE u.user_id = ?`,
      [userId]
    );
    return rows[0] || null;
  },

  // Cập nhật thời gian last seen (phục vụ hiển thị trạng thái online)
  updateLastSeen: async (userId) => {
    await pool.query('UPDATE users SET last_seen_at = NOW() WHERE user_id = ?', [userId]);
  },

  // Cập nhật thông tin cá nhân customer
  updateCustomerProfile: async (userId, { fullName, phone, address, district, city, preferredPayment }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?',
        [fullName, phone, userId]
      );
      await connection.query(
        'UPDATE customers SET address = ?, district = ?, city = ?, preferred_payment = ? WHERE user_id = ?',
        [address, district, city, preferredPayment, userId]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Cập nhật thông tin cá nhân helper
  updateHelperProfile: async (userId, { fullName, phone, address, hourlyRate, bio }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      await connection.query(
        'UPDATE users SET full_name = ?, phone = ? WHERE user_id = ?',
        [fullName, phone, userId]
      );
      await connection.query(
        'UPDATE helpers SET address = ?, hourly_rate = ?, bio = ? WHERE user_id = ?',
        [address, hourlyRate, bio, userId]
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Admin: danh sách tất cả user với bộ lọc
  adminListUsers: async ({ userType, isActive, isVerified, search, limit = 20, offset = 0 }) => {
    let query = `
      SELECT u.user_id AS userId, u.email, u.full_name AS fullName, u.phone,
             u.user_type AS userType, u.is_active AS isActive,
             u.avatar_url AS avatarUrl, u.created_at AS createdAt, u.last_seen_at AS lastSeenAt,
             h.helper_id AS helperId, h.is_verified AS isVerified,
             h.hourly_rate AS hourlyRate, h.rating_average AS ratingAverage, h.total_bookings AS totalBookings
      FROM users u
      LEFT JOIN helpers h ON u.user_id = h.user_id AND u.user_type = 'helper'
      WHERE 1=1
    `;
    const params = [];

    if (userType) { query += ' AND u.user_type = ?'; params.push(userType); }
    if (isActive !== undefined) { query += ' AND u.is_active = ?'; params.push(isActive); }
    if (isVerified !== undefined) { query += ' AND h.is_verified = ?'; params.push(isVerified === 'true'); }
    if (search) { query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Admin: kích hoạt / khóa tài khoản
  adminSetUserStatus: async (userId, isActive) => {
    await pool.query('UPDATE users SET is_active = ? WHERE user_id = ?', [isActive, userId]);
  },

  // Tìm hoặc tạo tài khoản customer từ OAuth (Google/Facebook) — không cần OTP
  findOrCreateOAuthCustomer: async ({ email, fullName, avatarUrl }) => {
    // User đã có và đang active → dùng luôn
    const existing = await UserModel.findByEmail(email);
    if (existing) return existing;

    // User tồn tại nhưng chưa active (đăng ký OTP dang dở) → kích hoạt luôn
    const inactive = await UserModel.findByEmailAny(email);
    if (inactive) {
      await pool.query('UPDATE users SET is_active = 1 WHERE email = ?', [email]);
      return await UserModel.findByEmail(email);
    }

    // Tạo user mới hoàn toàn (is_active=1, phone=NULL, password_hash=NULL)
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [r] = await connection.query(
        `INSERT INTO users (email, password_hash, full_name, phone, user_type, is_active, avatar_url)
         VALUES (?, NULL, ?, NULL, 'customer', 1, ?)`,
        [email, fullName || email.split('@')[0], avatarUrl || null]
      );
      await connection.query(
        'INSERT INTO customers (user_id, address, city) VALUES (?, ?, ?)',
        [r.insertId, '', '']
      );
      await connection.commit();
      return await UserModel.findByEmail(email);
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  },

  // Admin: xác minh helper (is_verified = true)
  adminVerifyHelper: async (helperId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Kích hoạt xác minh
      await connection.query('UPDATE helpers SET is_verified = TRUE WHERE helper_id = ?', [helperId]);

      // Đọc danh sách dịch vụ đang chờ
      const [[helper]] = await connection.query(
        'SELECT pending_service_ids FROM helpers WHERE helper_id = ?', [helperId]
      );

      if (helper?.pending_service_ids) {
        let serviceIds = [];
        try { serviceIds = JSON.parse(helper.pending_service_ids); } catch { /* bỏ qua */ }

        if (serviceIds.length > 0) {
          // Lấy base_price của các dịch vụ để lưu làm custom_price
          const [services] = await connection.query(
            `SELECT service_id, base_price FROM services WHERE service_id IN (${serviceIds.map(() => '?').join(',')})`,
            serviceIds
          );
          const priceMap = Object.fromEntries(services.map(s => [s.service_id, s.base_price]));

          for (const sid of serviceIds) {
            await connection.query(
              `INSERT IGNORE INTO helper_services (helper_id, service_id, experience_level, custom_price)
               VALUES (?, ?, 'beginner', ?)`,
              [helperId, sid, priceMap[sid] || null]
            );
          }

          // Xóa pending_service_ids sau khi đã xử lý
          await connection.query('UPDATE helpers SET pending_service_ids = NULL WHERE helper_id = ?', [helperId]);
        }
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = UserModel;
