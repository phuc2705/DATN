// Model Payment - quản lý thanh toán và lịch sử giao dịch
const { pool } = require('../config/database');

const PaymentModel = {
  // Xác nhận thanh toán thành công (cập nhật trạng thái)
  confirmPayment: async (bookingId, paidByUserId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE payments SET payment_status = 'paid', paid_at = NOW() WHERE booking_id = ?`,
        [bookingId]
      );

      // Nếu không có user (VNPay tự động), lấy customer_id của booking để ghi log
      let logUserId = paidByUserId;
      if (!logUserId) {
        const [[b]] = await connection.query(
          'SELECT c.user_id FROM bookings b JOIN customers c ON b.customer_id = c.customer_id WHERE b.booking_id = ?',
          [bookingId]
        );
        logUserId = b?.user_id;
      }

      if (logUserId) {
        await connection.query(
          `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
           VALUES (?, ?, 'confirmed', 'confirmed', 'Thanh toán thành công')`,
          [bookingId, logUserId]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Lấy chi tiết thanh toán của 1 booking
  findByBooking: async (bookingId) => {
    const [rows] = await pool.query(
      `SELECT p.*, b.booking_date, b.start_time, b.end_time, b.hours,
              s.service_name,
              uc.full_name AS customer_name,
              uh.full_name AS helper_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.booking_id
       JOIN services s ON b.service_id = s.service_id
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN users uc ON c.user_id = uc.user_id
       JOIN helpers h ON b.helper_id = h.helper_id
       JOIN users uh ON h.user_id = uh.user_id
       WHERE p.booking_id = ?`,
      [bookingId]
    );
    return rows[0] || null;
  },

  // Lịch sử thanh toán của khách hàng
  findByCustomer: async (customerId) => {
    const [rows] = await pool.query(
      `SELECT p.payment_id, p.amount, p.payment_method, p.payment_status, p.paid_at,
              b.booking_id, b.booking_date, b.hours,
              s.service_name,
              u.full_name AS helper_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.booking_id
       JOIN services s ON b.service_id = s.service_id
       JOIN helpers h ON b.helper_id = h.helper_id
       JOIN users u ON h.user_id = u.user_id
       WHERE b.customer_id = ?
       ORDER BY p.created_at DESC`,
      [customerId]
    );
    return rows;
  },

  // Thu nhập của helper (chỉ tính các đơn đã thanh toán)
  findByHelper: async (helperId) => {
    const [rows] = await pool.query(
      `SELECT p.payment_id, p.amount, p.payment_method, p.payment_status, p.paid_at,
              b.booking_id, b.booking_date, b.hours,
              s.service_name,
              u.full_name AS customer_name
       FROM payments p
       JOIN bookings b ON p.booking_id = b.booking_id
       JOIN services s ON b.service_id = s.service_id
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN users u ON c.user_id = u.user_id
       WHERE b.helper_id = ? AND p.payment_status = 'paid'
       ORDER BY p.paid_at DESC`,
      [helperId]
    );
    return rows;
  },

  // Admin: tất cả giao dịch với bộ lọc
  findAll: async ({ status, startDate, endDate, limit = 50, offset = 0 }) => {
    let query = `
      SELECT p.*, b.booking_date,
             uc.full_name AS customer_name,
             uh.full_name AS helper_name,
             s.service_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users uc ON c.user_id = uc.user_id
      LEFT JOIN helpers h ON b.helper_id = h.helper_id
      LEFT JOIN users uh ON h.user_id = uh.user_id
      JOIN services s ON b.service_id = s.service_id
      WHERE 1=1
    `;
    const params = [];

    if (status) { query += ' AND p.payment_status = ?'; params.push(status); }
    if (startDate) { query += ' AND DATE(p.created_at) >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND DATE(p.created_at) <= ?'; params.push(endDate); }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Tổng doanh thu (dùng cho admin dashboard)
  getTotalRevenue: async (startDate = null, endDate = null) => {
    let query = `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'paid'`;
    const params = [];
    if (startDate) { query += ' AND DATE(paid_at) >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND DATE(paid_at) <= ?'; params.push(endDate); }
    const [[{ total }]] = await pool.query(query, params);
    return total;
  },
};

module.exports = PaymentModel;
