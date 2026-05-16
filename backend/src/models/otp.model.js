// Model quản lý OTP xác nhận email khi đăng ký tài khoản
const { pool } = require('../config/database');

const OtpModel = {
  // Lưu mã OTP mới cho email (xóa OTP cũ nếu có, hết hạn sau 5 phút)
  create: async ({ email, otpCode }) => {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Xóa OTP cũ cùng email trước khi tạo mới
    await pool.execute('DELETE FROM otp_verifications WHERE email = ?', [email]);

    const [result] = await pool.execute(
      `INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES (?, ?, ?)`,
      [email, otpCode, expiresAt]
    );
    return result.insertId;
  },

  // Tìm bản ghi OTP chưa dùng theo email
  findByEmail: async (email) => {
    const [rows] = await pool.execute(
      `SELECT * FROM otp_verifications
       WHERE email = ? AND is_used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  },

  // Đánh dấu OTP đã được sử dụng
  markUsed: async (id) => {
    await pool.execute(
      'UPDATE otp_verifications SET is_used = 1 WHERE id = ?',
      [id]
    );
  },

  // Xóa OTP hết hạn (có thể gọi định kỳ)
  deleteExpired: async () => {
    await pool.execute('DELETE FROM otp_verifications WHERE expires_at < NOW()');
  },
};

module.exports = OtpModel;
