// Controller Admin - dashboard, quản lý user, booking, dịch vụ, khuyến mãi
const UserModel = require('../models/user.model');
const PaymentModel = require('../models/payment.model');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { pushNotification, mailIfOffline } = require('../utils/notify');
const { emitToUser } = require('../socket');
const { sendHelperAssignedEmail, sendBookingConfirmedEmail } = require('../utils/email');

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
        SELECT s.service_name AS serviceName, COUNT(b.booking_id) AS bookingCount
        FROM bookings b JOIN services s ON b.service_id = s.service_id
        GROUP BY s.service_id ORDER BY bookingCount DESC LIMIT 5
      `);

      // Thống kê tất cả trạng thái booking
      const [bookingStatusRows] = await pool.query(
        'SELECT status, COUNT(*) AS count FROM bookings GROUP BY status'
      );
      const bookingsByStatus = bookingStatusRows.reduce((acc, r) => {
        acc[r.status] = Number(r.count); return acc;
      }, {});
      const cancelledBookings = bookingsByStatus.cancelled || 0;
      const cancelRate = totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0;

      // Giá trị trung bình mỗi đơn
      const [[{ avgBookingValue }]] = await pool.query(
        'SELECT ROUND(AVG(total_price), 0) AS avgBookingValue FROM bookings WHERE status != ?',
        ['cancelled']
      );

      // So sánh doanh thu tháng này vs tháng trước
      const [[{ revenueThisMonth }]] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS revenueThisMonth FROM payments
        WHERE payment_status = 'paid'
          AND MONTH(paid_at) = MONTH(NOW()) AND YEAR(paid_at) = YEAR(NOW())
      `);
      const [[{ revenueLastMonth }]] = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS revenueLastMonth FROM payments
        WHERE payment_status = 'paid'
          AND MONTH(paid_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
          AND YEAR(paid_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      `);
      const revenueGrowth = revenueLastMonth > 0
        ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
        : null;

      // Khách hàng mới tháng này
      const [[{ newCustomersThisMonth }]] = await pool.query(`
        SELECT COUNT(*) AS newCustomersThisMonth FROM users
        WHERE user_type = 'customer'
          AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
      `);

      // Top 5 helper theo số đơn hoàn thành
      const [topHelpers] = await pool.query(`
        SELECT u.full_name AS fullName, u.avatar_url AS avatarUrl,
               h.total_bookings AS totalBookings,
               h.rating_average AS ratingAverage, h.helper_id AS helperId
        FROM helpers h
        JOIN users u ON h.user_id = u.user_id
        WHERE h.is_verified = TRUE
        ORDER BY h.total_bookings DESC, h.rating_average DESC
        LIMIT 5
      `);

      // Số phản hồi chưa xử lý
      const [[{ openFeedbacksCount }]] = await pool.query(
        "SELECT COUNT(*) AS openFeedbacksCount FROM system_feedbacks WHERE status = 'open'"
      );

      return sendSuccess(res, {
        totalUsers, totalHelpers, totalCustomers,
        totalBookings, pendingBookings, completedBookings,
        totalRevenue: revenue,
        monthlyRevenue, topServices,
        bookingsByStatus, cancelledBookings, cancelRate,
        avgBookingValue: avgBookingValue || 0,
        revenueThisMonth, revenueLastMonth, revenueGrowth,
        newCustomersThisMonth,
        topHelpers,
        openFeedbacksCount: Number(openFeedbacksCount),
      });
    } catch (error) {
      next(error);
    }
  },

  // Danh sách tất cả user
  listUsers: async (req, res, next) => {
    try {
      const { userType, isActive, isVerified, search, limit = 20, offset = 0 } = req.query;
      const users = await UserModel.adminListUsers({
        userType,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        isVerified,
        search,
        limit: parseInt(limit),
        offset: parseInt(offset),
      });
      return sendSuccess(res, { users });
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

  // Xóa tài khoản user (chỉ admin)
  deleteUser: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const [[user]] = await pool.query('SELECT user_type FROM users WHERE user_id = ?', [userId]);
      if (!user) return sendError(res, 'Không tìm thấy tài khoản.', 404);
      if (user.user_type === 'admin') return sendError(res, 'Không thể xóa tài khoản admin.', 403);
      await pool.query('DELETE FROM users WHERE user_id = ?', [userId]);
      return sendSuccess(res, null, 'Đã xóa tài khoản.');
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

  // Danh sách tất cả booking (dùng LEFT JOIN để hiển thị cả đơn chưa có helper)
  listAllBookings: async (req, res, next) => {
    try {
      const { status, startDate, endDate, limit = 20, offset = 0 } = req.query;
      let query = `
        SELECT b.booking_id AS bookingId, b.booking_date AS bookingDate,
               b.start_time AS startTime, b.end_time AS endTime, b.status,
               b.total_price AS totalPrice, b.helper_id AS helperId, b.created_at AS createdAt,
               b.address,
               s.service_name AS serviceName,
               uc.full_name AS customerName,
               uh.full_name AS helperName,
               p.payment_status AS paymentStatus
        FROM bookings b
        JOIN services s ON b.service_id = s.service_id
        JOIN customers c ON b.customer_id = c.customer_id
        JOIN users uc ON c.user_id = uc.user_id
        LEFT JOIN helpers h ON b.helper_id = h.helper_id
        LEFT JOIN users uh ON h.user_id = uh.user_id
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
      return sendSuccess(res, { bookings: rows });
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
      // getTotalRevenue giờ trả về { totalRevenue, platformRevenue }
      const { totalRevenue, platformRevenue } = await PaymentModel.getTotalRevenue(startDate, endDate);
      return sendSuccess(res, { payments, totalRevenue, platformRevenue });
    } catch (error) {
      next(error);
    }
  },

  // Admin giao việc: gán helper cho booking chưa có người nhận
  assignHelper: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { helperId } = req.body;
      const { user_id } = req.user;

      if (!helperId) return sendError(res, 'Vui lòng chọn người giúp việc.', 400);

      // Kiểm tra booking tồn tại
      const [[booking]] = await pool.query('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
      if (!booking) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

      if (!['pending', 'confirmed'].includes(booking.status)) {
        return sendError(res, 'Chỉ có thể giao việc cho đơn đang chờ hoặc đã xác nhận.', 422);
      }

      // Kiểm tra helper hợp lệ và đang hoạt động
      const [[helper]] = await pool.query(
        'SELECT h.helper_id, h.is_verified, h.is_available, u.full_name FROM helpers h JOIN users u ON h.user_id = u.user_id WHERE h.helper_id = ?',
        [helperId]
      );
      if (!helper) return sendError(res, 'Không tìm thấy người giúp việc.', 404);
      if (!helper.is_verified) return sendError(res, 'Người giúp việc chưa được xác minh.', 400);

      // Kiểm tra xung đột lịch
      const hasConflict = await require('../models/booking.model').checkHelperConflict(
        helperId, booking.booking_date, booking.start_time, booking.end_time, bookingId
      );
      if (hasConflict) return sendError(res, 'Người giúp việc đã có lịch trong khung giờ này.', 409);

      // Gán helper và ghi log
      await pool.query('UPDATE bookings SET helper_id = ? WHERE booking_id = ?', [helperId, bookingId]);
      await pool.query(
        `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, ?, ?, ?)`,
        [bookingId, user_id, booking.status, booking.status, `Admin giao việc cho: ${helper.full_name}`]
      );

      // Thông báo real-time cho helper và customer
      const [[helperUser]] = await pool.query('SELECT u.user_id, u.email, u.full_name FROM helpers h JOIN users u ON h.user_id = u.user_id WHERE h.helper_id = ?', [helperId]);
      const [[customerUser]] = await pool.query('SELECT u.user_id, u.email, u.full_name FROM customers c JOIN users u ON c.user_id = u.user_id WHERE c.customer_id = ?', [booking.customer_id]);
      const [[svc]] = await pool.query('SELECT service_name FROM services WHERE service_id = ?', [booking.service_id]);

      const bookingInfo = {
        bookingId, serviceName: svc?.service_name,
        bookingDate: booking.booking_date, startTime: booking.start_time, endTime: booking.end_time,
        address: booking.address, totalPrice: booking.total_price,
      };

      if (helperUser) {
        pushNotification({
          userId: helperUser.user_id,
          title: `Bạn được giao đơn ${bookingId}`,
          body: `Admin đã giao đơn ngày ${booking.booking_date} cho bạn`,
          type: 'booking_confirmed',
          refId: parseInt(bookingId),
        });
        emitToUser(helperUser.user_id, 'booking:update', { bookingId: parseInt(bookingId), status: booking.status });
        mailIfOffline(helperUser.user_id, () => sendHelperAssignedEmail(helperUser.email, helperUser.full_name, bookingInfo));
      }
      if (customerUser) {
        pushNotification({
          userId: customerUser.user_id,
          title: `Đơn ${bookingId} đã có người nhận`,
          body: `${helper.full_name} sẽ thực hiện đơn của bạn`,
          type: 'booking_confirmed',
          refId: parseInt(bookingId),
        });
        emitToUser(customerUser.user_id, 'booking:update', { bookingId: parseInt(bookingId), status: booking.status });
        mailIfOffline(customerUser.user_id, () => sendBookingConfirmedEmail(customerUser.email, customerUser.full_name, bookingInfo, helper.full_name));
      }

      return sendSuccess(res, null, `Đã giao việc cho ${helper.full_name} thành công!`);
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật trạng thái booking (admin can cancel/confirm)
  updateBookingStatus: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { status } = req.body;
      const { user_id } = req.user;
      const allowed = ['confirmed', 'cancelled'];
      if (!allowed.includes(status)) return sendError(res, 'Trạng thái không hợp lệ.', 400);

      const [[booking]] = await pool.query(
        `SELECT b.*, s.service_name,
                uc.user_id AS customer_user_id, uc.email AS customer_email, uc.full_name AS customer_name,
                uh.user_id AS helper_user_id, uh.email AS helper_email, uh.full_name AS helper_name
         FROM bookings b
         JOIN services s ON b.service_id = s.service_id
         JOIN customers c ON b.customer_id = c.customer_id
         JOIN users uc ON c.user_id = uc.user_id
         LEFT JOIN helpers h ON b.helper_id = h.helper_id
         LEFT JOIN users uh ON h.user_id = uh.user_id
         WHERE b.booking_id = ?`,
        [bookingId]
      );
      if (!booking) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

      await pool.query('UPDATE bookings SET status = ? WHERE booking_id = ?', [status, bookingId]);
      await pool.query(
        'INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [bookingId, user_id, booking.status, status, 'Admin cập nhật trạng thái']
      );

      // Gửi email cho cả 2 bên khi admin hủy đơn
      if (status === 'cancelled') {
        const { sendCancelledEmail } = require('../utils/email');
        const bookingInfo = {
          bookingId, serviceName: booking.service_name,
          bookingDate: booking.booking_date, startTime: booking.start_time, endTime: booking.end_time,
          address: booking.address,
        };
        if (booking.customer_email) {
          mailIfOffline(booking.customer_user_id, () => sendCancelledEmail(booking.customer_email, booking.customer_name, bookingInfo, 'Quản trị viên'));
        }
        if (booking.helper_email) {
          mailIfOffline(booking.helper_user_id, () => sendCancelledEmail(booking.helper_email, booking.helper_name, bookingInfo, 'Quản trị viên'));
        }
      }

      return sendSuccess(res, null, 'Cập nhật trạng thái thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách dịch vụ
  listServices: async (req, res, next) => {
    try {
      const [rows] = await pool.query(`
        SELECT service_id AS serviceId, service_name AS serviceName,
               description, base_price AS basePrice, icon_url AS iconUrl,
               is_active AS isActive, slug
        FROM services ORDER BY service_id
      `);
      return sendSuccess(res, { services: rows });
    } catch (error) {
      next(error);
    }
  },

  // Tạo dịch vụ mới
  createService: async (req, res, next) => {
    try {
      const { serviceName, description, basePrice, iconUrl } = req.body;
      const slug = serviceName.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const [result] = await pool.query(
        'INSERT INTO services (service_name, description, base_price, icon_url, slug) VALUES (?, ?, ?, ?, ?)',
        [serviceName, description || null, basePrice, iconUrl || null, slug]
      );
      return sendSuccess(res, { serviceId: result.insertId }, 'Đã tạo dịch vụ mới!');
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

  // Bật/tắt trạng thái dịch vụ
  toggleServiceStatus: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const [[svc]] = await pool.query('SELECT is_active FROM services WHERE service_id = ?', [serviceId]);
      if (!svc) return sendError(res, 'Không tìm thấy dịch vụ.', 404);
      const newStatus = !svc.is_active;
      await pool.query('UPDATE services SET is_active = ? WHERE service_id = ?', [newStatus, serviceId]);
      return sendSuccess(res, null, newStatus ? 'Đã hiện dịch vụ.' : 'Đã ẩn dịch vụ.');
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
      const { code, title, discountType, discountValue, minOrderAmount, maxUses, maxUsesPerUser, startDate, endDate } = req.body;
      const { user_id } = req.user;

      // Kiểm tra mã đã tồn tại
      const [existing] = await pool.query('SELECT promo_id FROM promotions WHERE code = ?', [code]);
      if (existing[0]) return sendError(res, 'Mã khuyến mãi đã tồn tại.', 409);

      const [result] = await pool.query(
        `INSERT INTO promotions (code, title, discount_type, discount_value, min_order_value, max_uses, max_uses_per_user, start_date, end_date, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, title || code, discountType, discountValue, minOrderAmount || 0, maxUses || null, maxUsesPerUser || 1, startDate, endDate, user_id]
      );
      return sendSuccess(res, { promoId: result.insertId }, 'Tạo mã khuyến mãi thành công!', 201);
    } catch (error) {
      next(error);
    }
  },

  // Cập nhật mã khuyến mãi (bật/tắt hoặc sửa thông tin)
  updatePromotion: async (req, res, next) => {
    try {
      const { promoId } = req.params;
      const { isActive, code, discountType, discountValue, minOrderAmount, maxUses, startDate, endDate } = req.body;
      await pool.query(
        `UPDATE promotions SET
           is_active       = COALESCE(?, is_active),
           code            = COALESCE(?, code),
           discount_type   = COALESCE(?, discount_type),
           discount_value  = COALESCE(?, discount_value),
           min_order_value = COALESCE(?, min_order_value),
           max_uses        = COALESCE(?, max_uses),
           start_date      = COALESCE(?, start_date),
           end_date        = COALESCE(?, end_date)
         WHERE promo_id = ?`,
        [isActive ?? null, code || null, discountType || null, discountValue ?? null,
         minOrderAmount ?? null, maxUses ?? null, startDate || null, endDate || null, promoId]
      );
      return sendSuccess(res, null, 'Cập nhật khuyến mãi thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Xóa mã khuyến mãi
  deletePromotion: async (req, res, next) => {
    try {
      const { promoId } = req.params;
      const [[promo]] = await pool.query('SELECT promo_id FROM promotions WHERE promo_id = ?', [promoId]);
      if (!promo) return sendError(res, 'Không tìm thấy mã khuyến mãi.', 404);
      await pool.query('DELETE FROM promotions WHERE promo_id = ?', [promoId]);
      return sendSuccess(res, null, 'Đã xóa mã khuyến mãi.');
    } catch (error) {
      next(error);
    }
  },

  // Chi tiết hồ sơ helper (dành cho admin xét duyệt)
  getHelperDetail: async (req, res, next) => {
    try {
      const { helperId } = req.params;
      const [[helper]] = await pool.query(
        `SELECT h.helper_id, h.bio, h.id_card_number, h.date_of_birth, h.gender,
                h.is_verified, h.is_available, h.rating_average, h.total_reviews,
                h.hourly_rate, h.latitude, h.longitude, h.created_at AS joined_at,
                u.user_id, u.full_name, u.email, u.phone, u.avatar_url, u.is_active,
                (SELECT COUNT(*) FROM bookings b WHERE b.helper_id = h.helper_id AND b.status = 'completed') AS completed_bookings,
                (SELECT COUNT(*) FROM bookings b WHERE b.helper_id = h.helper_id AND b.status = 'cancelled') AS cancelled_bookings,
                (SELECT COALESCE(SUM(p.amount), 0) FROM payments p JOIN bookings b ON p.booking_id = b.booking_id WHERE b.helper_id = h.helper_id AND p.payment_status = 'paid') AS total_earned
         FROM helpers h
         JOIN users u ON h.user_id = u.user_id
         WHERE h.helper_id = ?`,
        [helperId]
      );
      if (!helper) return sendError(res, 'Không tìm thấy người giúp việc.', 404);

      const [services] = await pool.query(
        `SELECT s.service_id, s.service_name, hs.custom_price, hs.experience_level
         FROM helper_services hs JOIN services s ON hs.service_id = s.service_id
         WHERE hs.helper_id = ?`,
        [helperId]
      );

      const [recentBookings] = await pool.query(
        `SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.status,
                b.total_price, s.service_name,
                uc.full_name AS customer_name
         FROM bookings b
         JOIN services s ON b.service_id = s.service_id
         JOIN customers c ON b.customer_id = c.customer_id
         JOIN users uc ON c.user_id = uc.user_id
         WHERE b.helper_id = ?
         ORDER BY b.booking_date DESC LIMIT 5`,
        [helperId]
      );

      const [recentReviews] = await pool.query(
        `SELECT r.rating, r.comment, r.created_at, uc.full_name AS customer_name
         FROM reviews r
         JOIN customers c ON r.customer_id = c.customer_id
         JOIN users uc ON c.user_id = uc.user_id
         WHERE r.helper_id = ? AND r.is_visible = TRUE
         ORDER BY r.created_at DESC LIMIT 5`,
        [helperId]
      );

      return sendSuccess(res, { ...helper, services, recentBookings, recentReviews });
    } catch (error) {
      next(error);
    }
  },

  // Danh sách tất cả đánh giá (admin quản lý)
  listReviews: async (req, res, next) => {
    try {
      const { rating, isVisible, search, limit = 20, offset = 0 } = req.query;
      let where = 'WHERE 1=1';
      const params = [];

      if (rating) { where += ' AND r.rating = ?'; params.push(Number(rating)); }
      if (isVisible !== undefined) { where += ' AND r.is_visible = ?'; params.push(isVisible === 'true'); }
      if (search) {
        where += ' AND (uh.full_name LIKE ? OR uc.full_name LIKE ? OR r.comment LIKE ?)';
        const q = `%${search}%`;
        params.push(q, q, q);
      }

      const [rows] = await pool.query(
        `SELECT r.review_id, r.rating, r.comment, r.is_visible, r.created_at,
                b.booking_id, b.booking_date,
                uh.full_name AS helper_name, uh.avatar_url AS helper_avatar,
                uc.full_name AS customer_name, uc.avatar_url AS customer_avatar
         FROM reviews r
         JOIN bookings b ON r.booking_id = b.booking_id
         JOIN helpers h ON r.helper_id = h.helper_id
         JOIN users uh ON h.user_id = uh.user_id
         JOIN customers c ON r.customer_id = c.customer_id
         JOIN users uc ON c.user_id = uc.user_id
         ${where}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
      );

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM reviews r
         JOIN helpers h ON r.helper_id = h.helper_id JOIN users uh ON h.user_id = uh.user_id
         JOIN customers c ON r.customer_id = c.customer_id JOIN users uc ON c.user_id = uc.user_id
         ${where}`,
        params
      );

      return sendSuccess(res, { reviews: rows, total });
    } catch (error) {
      next(error);
    }
  },

  // Bật/tắt hiển thị đánh giá
  toggleReviewVisibility: async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const [[review]] = await pool.query('SELECT review_id, is_visible FROM reviews WHERE review_id = ?', [reviewId]);
      if (!review) return sendError(res, 'Không tìm thấy đánh giá.', 404);
      const newVisible = !review.is_visible;
      await pool.query('UPDATE reviews SET is_visible = ? WHERE review_id = ?', [newVisible, reviewId]);
      // Cập nhật lại rating_average của helper
      await pool.query(
        `UPDATE helpers h SET rating_average = (
           SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE helper_id = h.helper_id AND is_visible = TRUE
         ) WHERE helper_id = (SELECT helper_id FROM reviews WHERE review_id = ?)`,
        [reviewId]
      );
      return sendSuccess(res, null, newVisible ? 'Đã hiện đánh giá.' : 'Đã ẩn đánh giá.');
    } catch (error) {
      next(error);
    }
  },

  // Xóa đánh giá
  deleteReview: async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const [[review]] = await pool.query('SELECT review_id, helper_id FROM reviews WHERE review_id = ?', [reviewId]);
      if (!review) return sendError(res, 'Không tìm thấy đánh giá.', 404);
      await pool.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
      await pool.query(
        'UPDATE helpers SET rating_average = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE helper_id = ? AND is_visible = TRUE), total_reviews = (SELECT COUNT(*) FROM reviews WHERE helper_id = ? AND is_visible = TRUE) WHERE helper_id = ?',
        [review.helper_id, review.helper_id, review.helper_id]
      );
      return sendSuccess(res, null, 'Đã xóa đánh giá.');
    } catch (error) {
      next(error);
    }
  },

  // Lấy cài đặt hệ thống (tỷ lệ hoa hồng, v.v.)
  getSettings: async (req, res, next) => {
    try {
      const SettingModel = require('../models/setting.model');
      const settings = await SettingModel.getAll();
      return sendSuccess(res, {
        platformCommissionRate: parseFloat(settings.platform_commission_rate) || 0.20,
      });
    } catch (error) { next(error); }
  },

  // Cập nhật cài đặt hệ thống
  updateSettings: async (req, res, next) => {
    try {
      const SettingModel = require('../models/setting.model');
      const { platformCommissionRate } = req.body;
      if (platformCommissionRate !== undefined) {
        const rate = parseFloat(platformCommissionRate);
        if (isNaN(rate) || rate < 0 || rate > 1) {
          return sendError(res, 'Tỷ lệ hoa hồng phải từ 0 đến 1 (ví dụ: 0.20 = 20%)', 400);
        }
        await SettingModel.set('platform_commission_rate', rate.toFixed(4));
      }
      const settings = await SettingModel.getAll();
      return sendSuccess(res, {
        platformCommissionRate: parseFloat(settings.platform_commission_rate) || 0.20,
      });
    } catch (error) { next(error); }
  },
};

module.exports = AdminController;
