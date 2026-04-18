// Controller quản lý thông tin cá nhân user (customer & helper)
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const UserController = {
  // Cập nhật thông tin cá nhân (customer hoặc helper)
  updateProfile: async (req, res, next) => {
    try {
      const { user_id, user_type } = req.user;

      if (user_type === 'customer') {
        const { fullName, phone, address, district, city, preferredPayment } = req.body;
        await UserModel.updateCustomerProfile(user_id, { fullName, phone, address, district, city, preferredPayment });
      } else if (user_type === 'helper') {
        const { fullName, phone, address, hourlyRate, bio } = req.body;
        await UserModel.updateHelperProfile(user_id, { fullName, phone, address, hourlyRate, bio });
      } else {
        return sendError(res, 'Không hỗ trợ cập nhật cho tài khoản này.', 400);
      }

      return sendSuccess(res, null, 'Cập nhật thông tin thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Đổi mật khẩu
  changePassword: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { currentPassword, newPassword } = req.body;

      // Lấy hash mật khẩu hiện tại
      const [rows] = await pool.query(
        'SELECT password_hash FROM users WHERE user_id = ?',
        [user_id]
      );
      if (!rows[0]) return sendError(res, 'Không tìm thấy tài khoản.', 404);

      const isValid = await bcrypt.compare(currentPassword, rows[0].password_hash);
      if (!isValid) return sendError(res, 'Mật khẩu hiện tại không đúng.', 400);

      const newHash = await bcrypt.hash(newPassword, 12);
      await pool.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [newHash, user_id]);

      return sendSuccess(res, null, 'Đổi mật khẩu thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Bật/tắt trạng thái available của helper
  toggleAvailability: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [rows] = await pool.query(
        'SELECT helper_id, is_available FROM helpers WHERE user_id = ?',
        [user_id]
      );
      if (!rows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      const newStatus = !rows[0].is_available;
      await pool.query('UPDATE helpers SET is_available = ? WHERE user_id = ?', [newStatus, user_id]);

      return sendSuccess(res, { isAvailable: newStatus },
        newStatus ? 'Bạn đang ở trạng thái nhận việc.' : 'Bạn đã tắt nhận việc.'
      );
    } catch (error) {
      next(error);
    }
  },

  // Lấy profile công khai của helper (dành cho customer xem)
  getHelperPublicProfile: async (req, res, next) => {
    try {
      const { helperId } = req.params;

      const [rows] = await pool.query(
        `SELECT u.user_id, u.full_name, u.avatar_url, u.last_seen_at,
                h.helper_id, h.rating_average, h.total_bookings, h.experience_years,
                h.is_verified, h.is_available, h.hourly_rate, h.bio, h.gender
         FROM helpers h
         JOIN users u ON h.user_id = u.user_id
         WHERE h.helper_id = ? AND u.is_active = TRUE`,
        [helperId]
      );
      if (!rows[0]) return sendError(res, 'Không tìm thấy helper.', 404);

      // Lấy danh sách dịch vụ helper cung cấp
      const [services] = await pool.query(
        `SELECT s.service_id, s.service_name, s.icon_url,
                hs.experience_level, COALESCE(hs.custom_price, s.base_price) AS price
         FROM helper_services hs
         JOIN services s ON hs.service_id = s.service_id
         WHERE hs.helper_id = ?`,
        [helperId]
      );

      return sendSuccess(res, { ...rows[0], services });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật lịch làm việc của helper (schedule)
  updateSchedule: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { schedules } = req.body;
      // schedules: [{ dayOfWeek, startTime, endTime, isAvailable }]

      const [helperRows] = await pool.query(
        'SELECT helper_id FROM helpers WHERE user_id = ?',
        [user_id]
      );
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);
      const { helper_id } = helperRows[0];

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Xóa lịch cũ rồi chèn lại toàn bộ
        await connection.query('DELETE FROM schedules WHERE helper_id = ?', [helper_id]);

        if (schedules && schedules.length > 0) {
          const values = schedules.map(s => [helper_id, s.dayOfWeek, s.startTime, s.endTime, s.isAvailable !== false]);
          await connection.query(
            'INSERT INTO schedules (helper_id, day_of_week, start_time, end_time, is_available) VALUES ?',
            [values]
          );
        }

        await connection.commit();
        return sendSuccess(res, null, 'Cập nhật lịch làm việc thành công!');
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } catch (error) {
      next(error);
    }
  },
};

module.exports = UserController;
