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
                h.is_verified, h.is_available, h.hourly_rate, h.bio, h.gender, h.date_of_birth
         FROM helpers h
         JOIN users u ON h.user_id = u.user_id
         WHERE h.helper_id = ? AND u.is_active = TRUE`,
        [helperId]
      );
      if (!rows[0]) return sendError(res, 'Không tìm thấy helper.', 404);

      // Lấy danh sách dịch vụ helper cung cấp
      const [serviceRows] = await pool.query(
        `SELECT s.service_id AS serviceId, s.service_name AS serviceName, s.icon_url AS iconUrl,
                hs.experience_level AS experienceLevel, COALESCE(hs.custom_price, s.base_price) AS price
         FROM helper_services hs
         JOIN services s ON hs.service_id = s.service_id
         WHERE hs.helper_id = ?`,
        [helperId]
      );

      const raw = rows[0];
      return sendSuccess(res, {
        userId:          raw.user_id,
        helperId:        raw.helper_id,
        fullName:        raw.full_name,
        avatarUrl:       raw.avatar_url,
        lastSeenAt:      raw.last_seen_at,
        ratingAverage:   Number(raw.rating_average) || 0,
        totalBookings:   raw.total_bookings || 0,
        experienceYears: raw.experience_years || 0,
        isVerified:      raw.is_verified,
        isAvailable:     raw.is_available,
        hourlyRate:      raw.hourly_rate,
        bio:             raw.bio,
        gender:          raw.gender,
        dateOfBirth:     raw.date_of_birth,
        services:        serviceRows,
      });
    } catch (error) {
      next(error);
    }
  },

  // Lấy lịch làm việc hiện tại của helper
  getSchedule: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [[helperRow]] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRow) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      const [rows] = await pool.query(
        'SELECT day_of_week AS dayOfWeek, start_time AS startTime, end_time AS endTime, is_available AS isAvailable FROM schedules WHERE helper_id = ?',
        [helperRow.helper_id]
      );
      return sendSuccess(res, { schedules: rows });
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách ca đã đăng ký (date-specific shifts)
  getShifts: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [[helperRow]] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRow) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      // Lấy các ca từ hôm nay trở về sau, sắp xếp theo ngày tăng dần
      const [rows] = await pool.query(
        `SELECT id,
                DATE_FORMAT(shift_date, '%Y-%m-%d') AS shiftDate,
                TIME_FORMAT(start_time, '%H:%i')    AS startTime,
                TIME_FORMAT(end_time,   '%H:%i')    AS endTime,
                status, created_at AS createdAt
         FROM helper_shift_registrations
         WHERE helper_id = ? AND shift_date >= CURDATE()
         ORDER BY shift_date ASC, start_time ASC`,
        [helperRow.helper_id]
      );
      return sendSuccess(res, { shifts: rows });
    } catch (error) {
      next(error);
    }
  },

  // Đăng ký một ca làm cụ thể theo ngày
  registerShift: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { shiftDate, startTime, endTime } = req.body;

      if (!shiftDate || !startTime || !endTime)
        return sendError(res, 'Thiếu thông tin ca làm (ngày, giờ bắt đầu, giờ kết thúc).', 400);

      // Không cho đăng ký ca trong quá khứ (dùng timezone Việt Nam UTC+7)
      const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
      const nowVN   = new Date(Date.now() + VN_OFFSET_MS);
      const todayVN = nowVN.toISOString().slice(0, 10);

      if (shiftDate < todayVN)
        return sendError(res, `Không thể đăng ký ca cho ngày ${shiftDate} đã qua. Vui lòng chọn ngày từ ${todayVN} trở đi.`, 400);

      // Nếu là hôm nay: không cho đăng ký ca đã kết thúc
      if (shiftDate === todayVN) {
        const [eh, em] = endTime.split(':').map(Number);
        const endMins  = eh * 60 + em;
        const nowMins  = nowVN.getUTCHours() * 60 + nowVN.getUTCMinutes();
        if (endMins <= nowMins)
          return sendError(res, 'Ca này đã kết thúc, vui lòng chọn ca khác hoặc ngày khác.', 400);
      }

      const [[helperRow]] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRow) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      // Kiểm tra trùng giờ với các ca active cùng ngày
      const [overlaps] = await pool.query(
        `SELECT id, start_time, end_time FROM helper_shift_registrations
         WHERE helper_id = ? AND shift_date = ? AND status = 'active'
           AND NOT (end_time <= ? OR start_time >= ?)`,
        [helperRow.helper_id, shiftDate, startTime, endTime]
      );
      if (overlaps.length > 0) {
        const ov = overlaps[0];
        const st = String(ov.start_time).slice(0, 5);
        const et = String(ov.end_time).slice(0, 5);
        return sendError(res, `Khung giờ trùng với ca ${st}–${et} đã đăng ký. Vui lòng chọn giờ khác.`, 409);
      }

      try {
        const [result] = await pool.query(
          `INSERT INTO helper_shift_registrations (helper_id, shift_date, start_time, end_time)
           VALUES (?, ?, ?, ?)`,
          [helperRow.helper_id, shiftDate, startTime, endTime]
        );
        return sendSuccess(res, { shiftId: result.insertId }, 'Đăng ký ca làm thành công!');
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
          return sendError(res, 'Ca này đã được đăng ký trước đó.', 409);
        throw err;
      }
    } catch (error) {
      next(error);
    }
  },

  // Hủy ca đã đăng ký (chỉ được hủy trước giờ vào ca 12 tiếng)
  cancelShift: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { shiftId } = req.params;

      const [[helperRow]] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRow) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      const [[shift]] = await pool.query(
        'SELECT id, shift_date, start_time, status FROM helper_shift_registrations WHERE id = ? AND helper_id = ?',
        [shiftId, helperRow.helper_id]
      );
      if (!shift) return sendError(res, 'Không tìm thấy ca làm.', 404);
      if (shift.status === 'cancelled') return sendError(res, 'Ca này đã bị hủy.', 400);

      // Kiểm tra điều kiện 12 tiếng
      const shiftStart = new Date(`${shift.shift_date.toISOString().slice(0, 10)}T${shift.start_time}`);
      const diffHours = (shiftStart - Date.now()) / 36e5;
      if (diffHours < 12)
        return sendError(res, 'Chỉ được hủy ca trước giờ vào ca ít nhất 12 tiếng.', 400);

      await pool.query(
        "UPDATE helper_shift_registrations SET status = 'cancelled' WHERE id = ?",
        [shiftId]
      );
      return sendSuccess(res, null, 'Hủy ca làm thành công!');
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
