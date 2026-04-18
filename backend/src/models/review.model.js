// Model Review - đánh giá và xếp hạng helper sau khi hoàn thành dịch vụ
const { pool } = require('../config/database');

const ReviewModel = {
  // Tạo đánh giá mới + cập nhật rating_average của helper (transaction)
  create: async ({ bookingId, customerId, helperId, rating, comment }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO reviews (booking_id, customer_id, helper_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [bookingId, customerId, helperId, rating, comment]
      );
      const reviewId = result.insertId;

      // Cập nhật rating_average của helper theo công thức trung bình cộng
      await connection.query(
        `UPDATE helpers
         SET rating_average = (
           SELECT ROUND(AVG(rating), 2) FROM reviews WHERE helper_id = ?
         )
         WHERE helper_id = ?`,
        [helperId, helperId]
      );

      // Đánh dấu booking đã được review
      await connection.query(
        'UPDATE bookings SET is_reviewed = TRUE WHERE booking_id = ?',
        [bookingId]
      );

      await connection.commit();
      return reviewId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Lấy tất cả đánh giá của một helper (hiển thị công khai)
  findByHelper: async (helperId, limit = 20, offset = 0) => {
    const [rows] = await pool.query(
      `SELECT r.review_id, r.rating, r.comment, r.created_at,
              u.full_name AS customer_name, u.avatar_url AS customer_avatar,
              s.service_name
       FROM reviews r
       JOIN customers c ON r.customer_id = c.customer_id
       JOIN users u ON c.user_id = u.user_id
       JOIN bookings b ON r.booking_id = b.booking_id
       JOIN services s ON b.service_id = s.service_id
       WHERE r.helper_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [helperId, limit, offset]
    );
    return rows;
  },

  // Đếm tổng số review của helper (phục vụ phân trang)
  countByHelper: async (helperId) => {
    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM reviews WHERE helper_id = ?',
      [helperId]
    );
    return total;
  },

  // Lấy đánh giá mà customer đã viết
  findByCustomer: async (customerId) => {
    const [rows] = await pool.query(
      `SELECT r.*, u.full_name AS helper_name, u.avatar_url AS helper_avatar,
              s.service_name, b.booking_date
       FROM reviews r
       JOIN helpers h ON r.helper_id = h.helper_id
       JOIN users u ON h.user_id = u.user_id
       JOIN bookings b ON r.booking_id = b.booking_id
       JOIN services s ON b.service_id = s.service_id
       WHERE r.customer_id = ?
       ORDER BY r.created_at DESC`,
      [customerId]
    );
    return rows;
  },

  // Kiểm tra booking đã được review chưa (tránh review 2 lần)
  findByBooking: async (bookingId) => {
    const [rows] = await pool.query(
      'SELECT review_id FROM reviews WHERE booking_id = ?',
      [bookingId]
    );
    return rows[0] || null;
  },
};

module.exports = ReviewModel;
