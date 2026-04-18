// Controller đặt lịch - tích hợp logic tính giá tập trung và kiểm tra xung đột lịch
const BookingModel = require('../models/booking.model');
const ServiceModel = require('../models/service.model');
const UserModel = require('../models/user.model');
const { pool } = require('../config/database');
const { calculateBookingPrice } = require('../utils/pricing');
const { sendSuccess, sendError } = require('../utils/response');

// State machine: định nghĩa chuyển trạng thái hợp lệ
// Key = trạng thái hiện tại, Value = danh sách trạng thái được phép chuyển sang
const VALID_TRANSITIONS = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed:   [],
  cancelled:   [],
};

// Kiểm tra chuyển trạng thái hợp lệ theo state machine
const assertValidTransition = (currentStatus, newStatus) => {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw Object.assign(
      new Error(`Không thể chuyển trạng thái từ "${currentStatus}" sang "${newStatus}".`),
      { statusCode: 422 }
    );
  }
};

const BookingController = {
  // Khách hàng tạo đơn đặt lịch mới
  createBooking: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { helperId, serviceId, promoCode, bookingDate, startTime, endTime, address, note, paymentMethod } = req.body;

      // Lấy thông tin customer từ user_id
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      // Lấy thông tin helper, kiểm tra helper đang nhận việc và đã được xác minh
      const [helperRows] = await pool.query(
        `SELECT h.*, COALESCE(hs.custom_price, s.base_price) AS effective_rate
         FROM helpers h
         JOIN helper_services hs ON h.helper_id = hs.helper_id
         JOIN services s ON hs.service_id = s.service_id
         WHERE h.helper_id = ? AND hs.service_id = ?`,
        [helperId, serviceId]
      );
      if (!helperRows[0]) return sendError(res, 'Helper không cung cấp dịch vụ này.', 400);

      const helper = helperRows[0];
      if (!helper.is_verified) return sendError(res, 'Helper chưa được xác minh tài khoản.', 400);
      if (!helper.is_available) return sendError(res, 'Helper hiện không nhận việc.', 400);

      const helperRate = parseFloat(helper.effective_rate);

      // Kiểm tra xung đột lịch làm việc của helper
      const hasConflict = await BookingModel.checkHelperConflict(helperId, bookingDate, startTime, endTime);
      if (hasConflict) return sendError(res, 'Helper đã có lịch trong khung giờ này.', 409);

      // Xử lý mã khuyến mãi (nếu có)
      let promo = null;
      let promoId = null;
      if (promoCode) {
        const [promoRows] = await pool.query(
          `SELECT * FROM promotions
           WHERE code = ? AND is_active = TRUE
             AND start_date <= CURDATE() AND end_date >= CURDATE()
             AND (max_uses IS NULL OR used_count < max_uses)`,
          [promoCode]
        );
        if (!promoRows[0]) return sendError(res, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.', 400);
        promo = promoRows[0];
        promoId = promo.promo_id;

        // Kiểm tra giới hạn sử dụng mỗi user
        const [usageRows] = await pool.query(
          'SELECT COUNT(*) AS cnt FROM promotion_usage WHERE promo_id = ? AND user_id = ?',
          [promoId, user_id]
        );
        if (usageRows[0].cnt >= promo.max_uses_per_user) {
          return sendError(res, 'Bạn đã sử dụng hết lượt dùng mã này.', 400);
        }
      }

      // Tính giá đơn hàng tại Backend (không tin dữ liệu giá từ Frontend)
      const { hours, basePrice, discountAmount, totalPrice } = calculateBookingPrice(
        startTime, endTime, helperRate, promo
      );

      const bookingId = await BookingModel.create({
        customerId: customerProfile.customer_id,
        helperId,
        serviceId,
        promoId,
        bookingDate,
        startTime,
        endTime,
        hours,
        address,
        basePrice,
        discountAmount,
        totalPrice,
        note,
        paymentMethod: paymentMethod || customerProfile.preferred_payment,
      });

      return sendSuccess(res, {
        bookingId,
        summary: { hours, basePrice, discountAmount, totalPrice },
      }, 'Đặt lịch thành công! Đang chờ xác nhận.', 201);
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách booking của khách hàng đang đăng nhập
  getMyBookingsAsCustomer: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { status } = req.query;
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);
      const bookings = await BookingModel.findByCustomer(customerProfile.customer_id, status);
      return sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách booking của helper đang đăng nhập
  getMyBookingsAsHelper: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { status } = req.query;
      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);
      const bookings = await BookingModel.findByHelper(helperRows[0].helper_id, status);
      return sendSuccess(res, bookings);
    } catch (error) {
      next(error);
    }
  },

  // Xem chi tiết booking (có kèm log lịch sử)
  getBookingDetail: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id, user_type } = req.user;
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);
      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  },

  // Helper xác nhận nhận đơn (pending -> confirmed)
  confirmBooking: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      // Kiểm tra ownership: helper chỉ được confirm đơn của chính mình
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0] || helperRows[0].helper_id !== booking.helper_id) {
        return sendError(res, 'Bạn không có quyền xác nhận đơn này.', 403);
      }

      // Kiểm tra state machine
      assertValidTransition(booking.status, 'confirmed');

      await BookingModel.updateStatus(bookingId, 'confirmed', user_id, 'Helper xác nhận nhận đơn');
      return sendSuccess(res, null, 'Đã xác nhận đơn hàng.');
    } catch (error) {
      if (error.statusCode === 422) return sendError(res, error.message, 422);
      next(error);
    }
  },

  // Helper check-in khi đến nơi (confirmed -> in_progress)
  checkIn: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      // Kiểm tra ownership
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0] || helperRows[0].helper_id !== booking.helper_id) {
        return sendError(res, 'Bạn không có quyền check-in đơn này.', 403);
      }

      // Kiểm tra state machine
      assertValidTransition(booking.status, 'in_progress');

      await BookingModel.updateStatus(bookingId, 'in_progress', user_id, 'Helper đã check-in');
      return sendSuccess(res, null, 'Check-in thành công!');
    } catch (error) {
      if (error.statusCode === 422) return sendError(res, error.message, 422);
      next(error);
    }
  },

  // Helper check-out khi hoàn thành (in_progress -> completed)
  checkOut: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      // Kiểm tra ownership
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0] || helperRows[0].helper_id !== booking.helper_id) {
        return sendError(res, 'Bạn không có quyền check-out đơn này.', 403);
      }

      // Kiểm tra state machine
      assertValidTransition(booking.status, 'completed');

      await BookingModel.updateStatus(bookingId, 'completed', user_id, 'Helper đã check-out - hoàn thành công việc');
      return sendSuccess(res, null, 'Check-out thành công! Đơn hàng đã hoàn thành.');
    } catch (error) {
      if (error.statusCode === 422) return sendError(res, error.message, 422);
      next(error);
    }
  },

  // Hủy booking (customer hoặc admin)
  cancelBooking: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id, user_type } = req.user;
      const { reason } = req.body;

      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      // Customer chỉ được hủy đơn của chính mình
      if (user_type === 'customer') {
        const customerProfile = await UserModel.getCustomerProfile(user_id);
        if (!customerProfile || customerProfile.customer_id !== booking.customer_id) {
          return sendError(res, 'Bạn không có quyền hủy đơn này.', 403);
        }
      }

      // Kiểm tra state machine: chỉ hủy được khi đang pending hoặc confirmed
      assertValidTransition(booking.status, 'cancelled');

      await BookingModel.updateStatus(bookingId, 'cancelled', user_id, reason || 'Khách hàng hủy đơn');
      return sendSuccess(res, null, 'Đã hủy đơn hàng.');
    } catch (error) {
      if (error.statusCode === 422) return sendError(res, error.message, 422);
      next(error);
    }
  },
};

module.exports = BookingController;
