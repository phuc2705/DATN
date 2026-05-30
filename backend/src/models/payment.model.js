// Model Payment - quản lý thanh toán và lịch sử giao dịch
const { pool } = require('../config/database');
const SettingModel = require('./setting.model');

const PaymentModel = {
  // Xác nhận thanh toán thành công (cập nhật trạng thái + cập nhật ví helper)
  confirmPayment: async (bookingId, paidByUserId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Đọc tỷ lệ hoa hồng hiện tại từ cấu hình hệ thống
      const rateStr = await SettingModel.get('platform_commission_rate');
      const commissionRate = parseFloat(rateStr) || 0.20;

      // Lấy amount, payment_method và thông tin helper trong 1 query
      const [[payRow]] = await connection.query(
        `SELECT p.amount, p.payment_method,
                h.user_id AS helper_user_id
         FROM payments p
         JOIN bookings b  ON b.booking_id = p.booking_id
         LEFT JOIN helpers h ON h.helper_id = b.helper_id
         WHERE p.booking_id = ?`,
        [bookingId]
      );

      const amount             = payRow ? Number(payRow.amount) : 0;
      const paymentMethod      = payRow?.payment_method || 'cash';
      const helperUserId       = payRow?.helper_user_id || null;
      const platformFeeAmount  = Math.round(amount * commissionRate);
      const helperEarningAmount = amount - platformFeeAmount;

      await connection.query(
        `UPDATE payments SET payment_status = 'paid', paid_at = NOW(),
         commission_rate = ?, platform_fee_amount = ?, helper_earning = ?
         WHERE booking_id = ?`,
        [commissionRate, platformFeeAmount, helperEarningAmount, bookingId]
      );

      // ── Cập nhật ví helper ──────────────────────────────────────────
      if (helperUserId) {
        // Tạo ví nếu chưa có (balance có thể âm nên không đặt minimum)
        await connection.query(
          `INSERT IGNORE INTO wallets (user_id, balance, total_earned, total_withdrawn)
           VALUES (?, 0, 0, 0)`,
          [helperUserId]
        );

        // Lấy ví trước khi thay đổi để tính balance_after đúng
        const [[w]] = await connection.query(
          'SELECT wallet_id, balance FROM wallets WHERE user_id = ?', [helperUserId]
        );

        if (paymentMethod === 'cash') {
          // Tiền mặt: helper thu trực tiếp → nền tảng khấu trừ phí hoa hồng
          // Chỉ insert wallet_transaction, trigger tự cập nhật balance (tránh double-deduction)
          const balanceAfter = Number(w.balance) - platformFeeAmount;
          await connection.query(
            `INSERT INTO wallet_transactions
               (wallet_id, type, amount, balance_after, source, booking_id, description)
             VALUES (?, 'debit', ?, ?, 'booking_payment', ?, ?)`,
            [w.wallet_id, platformFeeAmount, balanceAfter, bookingId,
             `Khấu trừ phí nền tảng ${Math.round(commissionRate * 100)}% — Đơn #${bookingId} (tiền mặt)`]
          );
        } else {
          // Online (VNPay/bank): nền tảng nhận tiền → cộng phần helper vào ví
          // Chỉ insert wallet_transaction, trigger tự cập nhật balance (tránh double-credit)
          const balanceAfter = Number(w.balance) + helperEarningAmount;
          const methodLabel = paymentMethod === 'vnpay' ? 'VNPay' : 'Chuyển khoản';
          await connection.query(
            `INSERT INTO wallet_transactions
               (wallet_id, type, amount, balance_after, source, booking_id, description)
             VALUES (?, 'credit', ?, ?, 'booking_payment', ?, ?)`,
            [w.wallet_id, helperEarningAmount, balanceAfter, bookingId,
             `Thu nhập từ đơn #${bookingId} (${methodLabel})`]
          );
        }
      }

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
       LEFT JOIN helpers h ON b.helper_id = h.helper_id
       LEFT JOIN users uh ON h.user_id = uh.user_id
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
       LEFT JOIN helpers h ON b.helper_id = h.helper_id
       LEFT JOIN users u ON h.user_id = u.user_id
       WHERE b.customer_id = ?
       ORDER BY p.created_at DESC`,
      [customerId]
    );
    return rows;
  },

  // Thu nhập của helper (chỉ tính các đơn đã thanh toán)
  findByHelper: async (helperId) => {
    const [rows] = await pool.query(
      `SELECT p.payment_id, p.amount, p.commission_rate, p.platform_fee_amount, p.helper_earning,
              p.payment_method, p.payment_status, p.paid_at,
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
      SELECT p.payment_id AS paymentId, p.booking_id AS bookingId,
             p.amount, p.payment_method AS paymentMethod,
             p.payment_status AS paymentStatus, p.paid_at AS paidAt,
             p.created_at AS createdAt,
             p.commission_rate AS commissionRate,
             p.platform_fee_amount AS platformFeeAmount,
             p.helper_earning AS helperEarning,
             b.booking_date AS bookingDate,
             uc.full_name AS customerName,
             uh.full_name AS helperName,
             s.service_name AS serviceName
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

  // Tổng doanh thu (dùng cho admin dashboard) — trả về { totalRevenue, platformRevenue }
  getTotalRevenue: async (startDate = null, endDate = null) => {
    let query = `SELECT COALESCE(SUM(amount), 0) AS totalRevenue,
                        COALESCE(SUM(platform_fee_amount), 0) AS platformRevenue
                 FROM payments WHERE payment_status = 'paid'`;
    const params = [];
    if (startDate) { query += ' AND DATE(paid_at) >= ?'; params.push(startDate); }
    if (endDate) { query += ' AND DATE(paid_at) <= ?'; params.push(endDate); }
    const [[result]] = await pool.query(query, params);
    return result;
  },
};

module.exports = PaymentModel;
