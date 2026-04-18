// Model User - tất cả truy vấn liên quan đến bảng users, customers, helpers
const { pool } = require('../config/database');

const UserModel = {
  // Tìm user theo email (dùng khi đăng nhập)
  findByEmail: async (email) => {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email]
    );
    return rows[0] || null;
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

      // Tạo bản ghi trong bảng users
      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, full_name, phone, user_type) VALUES (?, ?, ?, ?, 'customer')`,
        [email, passwordHash, fullName, phone]
      );
      const userId = userResult.insertId;

      // Tạo bản ghi trong bảng customers
      await connection.query(
        'INSERT INTO customers (user_id, address, district, city) VALUES (?, ?, ?, ?)',
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
  createHelper: async ({ email, passwordHash, fullName, phone, dateOfBirth, gender, idCardNumber, address, hourlyRate, bio }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [userResult] = await connection.query(
        `INSERT INTO users (email, password_hash, full_name, phone, user_type) VALUES (?, ?, ?, ?, 'helper')`,
        [email, passwordHash, fullName, phone]
      );
      const userId = userResult.insertId;

      await connection.query(
        `INSERT INTO helpers (user_id, date_of_birth, gender, id_card_number, address, hourly_rate, bio)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, dateOfBirth, gender, idCardNumber, address, hourlyRate, bio]
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
  adminListUsers: async ({ userType, isActive, search, limit = 20, offset = 0 }) => {
    let query = `
      SELECT u.user_id, u.email, u.full_name, u.phone, u.user_type,
             u.is_active, u.avatar_url, u.created_at, u.last_seen_at
      FROM users u
      WHERE 1=1
    `;
    const params = [];

    if (userType) { query += ' AND u.user_type = ?'; params.push(userType); }
    if (isActive !== undefined) { query += ' AND u.is_active = ?'; params.push(isActive); }
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

  // Admin: xác minh helper (is_verified = true)
  adminVerifyHelper: async (helperId) => {
    await pool.query('UPDATE helpers SET is_verified = TRUE WHERE helper_id = ?', [helperId]);
  },
};

module.exports = UserModel;
