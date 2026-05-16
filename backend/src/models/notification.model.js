// Model Notification - thông báo trong hệ thống cho customer, helper, admin
const { pool } = require('../config/database');

const NotificationModel = {
  // Tạo thông báo mới gửi đến một user
  create: async ({ userId, title, body, type, refId = null }) => {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, title, body, type, data)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, body, type, refId ? JSON.stringify({ refId }) : null]
    );
    return result.insertId;
  },

  // Lấy danh sách thông báo của user (phân trang)
  findByUser: async (userId, limit = 20, offset = 0) => {
    const [rows] = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  },

  // Đếm thông báo chưa đọc
  countUnread: async (userId) => {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
    return total;
  },

  // Đánh dấu 1 thông báo đã đọc
  markAsRead: async (notificationId, userId) => {
    const [result] = await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE notification_id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  },

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async (userId) => {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );
  },
};

module.exports = NotificationModel;
