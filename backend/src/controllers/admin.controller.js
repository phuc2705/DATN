// Controller Admin - dashboard, quản lý user, booking, dịch vụ, khuyến mãi
const UserModel = require('../models/user.model');
const PaymentModel = require('../models/payment.model');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const AdminController = {
  // Thống kê tổng quan cho dashboard
  getDashboardStats: async (req, res, next) => {
    try {
      const [[{ totalUsers }]] = await pool.query("SELECT COUNT(*) AS totalUsers FROM users WHERE user_type != 'admin'");
      const [[{ totalHelpers }]] = await pool.query("SELECT COUNT(*) AS totalHelpers FROM helpers");
      const [[{ totalCustomers }]] = await pool.query("SELECT COUNT(*) AS totalCustomers FROM customers");
      const [[{ totalBookings }]] = await pool.query("SELECT COUNT(*) AS totalBookings FROM bookings");
      const [[{ pendingBookings }]] = await pool.query("SELECT COUNT(*) AS pendingBookings FROM bookings WHERE status = 'pending'");
      const [[{ completedBookings }]] = await pool.query("SELECT COUNT(*) AS completedBookings FROM bookings WHERE status = 'completed'");
      const [[{ revenue }]] = await pool.query("SELECT COALESCE(SUM(amount), 0) AS revenue FROM payments WHERE payment_status = 'paid'");

      // Thống kê theo tháng (6 tháng gần nhất)
      const [monthlyRevenue] = await pool.query(`
        SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month, COALESCE(SUM(amount), 0) AS revenue
        FROM payments
        WHERE payment_status = 'paid' AND paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY month ORDER BY month ASC
      `);

      // Dịch vụ phổ biến nhất
      const [topServices] = await pool.query(`
        SELECT s.service_name, COUNT(b.booking_id) AS bookingCount
        FROM bookings b JOIN services s ON b.service_id = s.service_id
        GROUP BY s.service_id ORDER BY bookingCount DESC LIMIT 5
      `);

      return sendSuccess(res, {
        totalUsers, totalHelpers, totalCustomers,
        totalBookings, pendingBookings, completedBookings,
        totalRevenue: revenue,
        monthlyRevenue,
        topServices,
      });
    } catch (error) {
      next(error);
    }
  },

  // Danh sách tất cả user
  listUsers: async (req, res, next) => {
    try {
      const { userType, isActive, search, limit = 20, offset = 0 } = req.query;
      const users = await UserModel.adminListUsers({
        userType,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      return sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  },

  // Kích hoạt / khóa tài khoản user
  setUserStatus: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      await UserModel.adminSetUserStatus(userId, isActive);
      return sendSuccess(res, null, isActive ? 'Đã kích hoạt tài khoản.' : 'Đã khóa tài khoản.');
    } catch (error) {
      next(error);
    }
  },

  // Xác minh helper (cấp badge is_verified)
  verifyHelper: async (req, res, next) => {
    try {
      const { helperId } = req.params;
      await UserModel.adminVerifyHelper(helperId);
      return sendSuccess(res, null, 'Đã xác minh helper thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Danh sách tất cả booking
  listAllBookings: async (req, res, next) => {
    try {
      const { status, startDate, endDate, limit = 20, offset = 0 } = req.query;
      let query = `
        SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.status,
               b.total_price, b.created_at,
               s.service_name,
               uc.full_name AS customer_name,
               uh.full_name AS helper_name,
               p.payment_status
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN users uc ON c.user_id = uc.user_id
        JOIN helpers h ON b.helper_id = h.helper_id
        JOIN users uh ON h.user_id = uh.user_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id
        WHERE 1=1
      `;
      const params = [];

      if (status) { query += ' AND b.status = ?'; params.push(status); }
      if (startDate) { query += ' AND DATE(b.booking_date) >= ?'; params.push(startDate); }
      if (endDate) { query += ' AND DATE(b.booking_date) <= ?'; params.push(endDate); }

      query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await pool.query(query, params);
      return sendSuccess(res, rows);
    } catch (error) {
      next(error);
    }
  },

  // Danh sách tất cả thanh toán
  listAllPayments: async (req, res, next) => {
    try {
      const { status, startDate, endDate, limit = 50, offset = 0 } = req.query;
      const payments = await PaymentModel.findAll({
        status, startDate, endDate,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      const totalRevenue = await PaymentModel.getTotalRevenue(startDate, endDate);
      return sendSuccess(res, { payments, totalRevenue });
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật thông tin dịch vụ
  updateService: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const { serviceName, description, basePrice, iconUrl } = req.body;
      await pool.query(
        'UPDATE services SET service_name = ?, description = ?, base_price = ?, icon_url = ? WHERE service_id = ?',
        [serviceName, description, basePrice, iconUrl, serviceId]
      );
      return sendSuccess(res, null, 'Cập nhật dịch vụ thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Ẩn dịch vụ (soft delete)
  deleteService: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      await pool.query('UPDATE services SET is_active = FALSE WHERE service_id = ?', [serviceId]);
      return sendSuccess(res, null, 'Đã ẩn dịch vụ.');
    } catch (error) {
      next(error);
    }
  },

  // Danh sách mã khuyến mãi
  listPromotions: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT * FROM promotions ORDER BY created_at DESC'
      );
      return sendSuccess(res, rows);
    } catch (error) {
      next(error);
    }
  },

  // Tạo mã khuyến mãi mới
  createPromotion: async (req, res, next) => {
    try {
      const { code, discountType, discountValue, minOrderAmount, maxUses, maxUsesPerUser, startDate, endDate } = req.body;

      // Kiểm tra mã đã tồn tại
      const [existing] = await pool.query('SELECT promo_id FROM promotions WHERE code = ?', [code]);
      if (existing[0]) return sendError(res, 'Mã khuyến mãi đã tồn tại.', 409);

      const [result] = await pool.query(
        `INSERT INTO promotions (code, discount_type, discount_value, min_order_amount, max_uses, max_uses_per_user, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, discountType, discountValue, minOrderAmount || null, maxUses || null, maxUsesPerUser || 1, startDate, endDate]
      );
      return sendSuccess(res, { promoId: result.insertId }, 'Tạo mã khuyến mãi thành công!', 201);
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật / bật-tắt mã khuyến mãi
  updatePromotion: async (req, res, next) => {
    try {
      const { promoId } = req.params;
      const { isActive, endDate, maxUses } = req.body;
      await pool.query(
        'UPDATE promotions SET is_active = COALESCE(?, is_active), end_date = COALESCE(?, end_date), max_uses = COALESCE(?, max_uses) WHERE promo_id = ?',
        [isActive, endDate, maxUses, promoId]
      );
      return sendSuccess(res, null, 'Cập nhật khuyến mãi thành công!');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AdminController;
