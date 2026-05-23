// Controller đặt lịch - tích hợp logic tính giá tập trung và kiểm tra xung đột lịch
const BookingModel = require('../models/booking.model');
const UserModel = require('../models/user.model');
const { pool } = require('../config/database');
const { calculateBookingPrice, getEffectiveRate } = require('../utils/pricing');
const { findSuggestedHelpers } = require('../utils/matching');
const { geocodeAddress } = require('../utils/geocode');
const { sendSuccess, sendError } = require('../utils/response');
const { pushNotification } = require('../utils/notify');
const { emitToUser } = require('../socket');

// Chuyển snake_case từ DB sang camelCase cho client
function mapBooking(b) {
  if (!b) return null;
  return {
    bookingId:      b.booking_id,
    serviceId:      b.service_id,
    serviceName:    b.service_name,
    customerId:     b.customer_id,
    customerName:   b.customer_name,
    customerPhone:  b.customer_phone,
    helperId:       b.helper_id,
    helperName:     b.helper_name,
    helperAvatar:   b.helper_avatar,
    helperPhone:    b.helper_phone,
    bookingDate:    b.booking_date,
    startTime:      b.start_time,
    endTime:        b.end_time,
    hours:          b.hours,
    address:        b.address,
    note:           b.note,
    status:         b.status,
    basePrice:      b.base_price,
    totalPrice:     b.total_price,
    discountAmount: b.discount_amount,
    paymentMethod:  b.payment_method,
    paymentStatus:  b.payment_status,
    paidAt:         b.paid_at,
    checkinAt:      b.checkin_at,
    checkoutAt:     b.checkout_at,
    hasReviewed:    b.has_reviewed || false,
    isRequested:    Boolean(b.is_requested),
    createdAt:      b.created_at,
    logs:           b.logs || [],
  };
}

// State machine: định nghĩa chuyển trạng thái hợp lệ
const VALID_TRANSITIONS = {
  pending:     ['confirmed', 'cancelled'],
  confirmed:   ['in_progress', 'cancelled'],
  in_progress: ['completed'],
  completed:   [],
  cancelled:   [],
};

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
  // Khách hàng tạo đơn đặt lịch - helper_id = null (mở cho tất cả helper) hoặc yêu cầu helper quen cũ
  createBooking: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { helperId, serviceId, promoCode, bookingDate, startTime, endTime, address, note, paymentMethod } = req.body;

      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      // Kiểm tra xung đột lịch của khách hàng (tránh đặt 2 đơn cùng khung giờ)
      const customerHasConflict = await BookingModel.checkCustomerConflict(
        customerProfile.customer_id, bookingDate, startTime, endTime
      );
      if (customerHasConflict) return sendError(res, 'Bạn đã có lịch đặt trong khung giờ này.', 409);

      // Lấy thông tin dịch vụ để tính giá
      const [serviceRows] = await pool.query('SELECT * FROM services WHERE service_id = ? AND is_active = 1', [serviceId]);
      if (!serviceRows[0]) return sendError(res, 'Dịch vụ không tồn tại.', 400);

      let helperRate = parseFloat(serviceRows[0].base_price);

      // Nếu có yêu cầu helper cũ: kiểm tra đây có phải helper đã từng làm cho customer không
      if (helperId) {
        const [prevCheck] = await pool.query(
          `SELECT COUNT(*) AS cnt FROM bookings
           WHERE customer_id = ? AND helper_id = ? AND status = 'completed'`,
          [customerProfile.customer_id, helperId]
        );
        if (prevCheck[0].cnt === 0) {
          return sendError(res, 'Bạn chỉ có thể yêu cầu người giúp việc đã từng làm cho bạn.', 400);
        }

        const [helperRows] = await pool.query(
          `SELECT h.helper_id, h.is_verified, h.is_available,
                  hs.custom_price, hs.experience_level
           FROM helpers h
           LEFT JOIN helper_services hs ON h.helper_id = hs.helper_id AND hs.service_id = ?
           WHERE h.helper_id = ?`,
          [serviceId, helperId]
        );
        if (!helperRows[0]) return sendError(res, 'Không tìm thấy người giúp việc.', 400);

        const helper = helperRows[0];
        if (!helper.is_verified) return sendError(res, 'Người giúp việc chưa được xác minh tài khoản.', 400);
        if (!helper.is_available) return sendError(res, 'Người giúp việc hiện không nhận việc.', 400);

        // Dùng giá hiệu dụng nếu helper có cài custom_price cho dịch vụ này
        if (helper.custom_price !== null || helper.experience_level) {
          helperRate = getEffectiveRate(helperRate, helper.custom_price, helper.experience_level);
        }

        // Kiểm tra xung đột lịch làm việc của helper
        const hasConflict = await BookingModel.checkHelperConflict(helperId, bookingDate, startTime, endTime);
        if (hasConflict) return sendError(res, 'Người giúp việc đã có lịch trong khung giờ này.', 409);
      }

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

        const [usageRows] = await pool.query(
          'SELECT COUNT(*) AS cnt FROM promotion_usage WHERE promo_id = ? AND user_id = ?',
          [promoId, user_id]
        );
        if (usageRows[0].cnt >= promo.max_uses_per_user) {
          return sendError(res, 'Bạn đã sử dụng hết lượt dùng mã này.', 400);
        }
      }

      // Tính giá tại Backend (không tin dữ liệu giá từ Frontend)
      const { hours, basePrice, discountAmount, totalPrice } = calculateBookingPrice(
        startTime, endTime, helperRate, promo
      );

      // Đếm số helper có thể nhận đơn này (available + verified + đăng ký dịch vụ + không bị xung đột giờ)
      const [availRows] = await pool.query(
        `SELECT COUNT(DISTINCT h.helper_id) AS cnt
         FROM helpers h
         JOIN helper_services hs ON h.helper_id = hs.helper_id
         WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
           AND h.helper_id NOT IN (
             SELECT DISTINCT helper_id FROM bookings
             WHERE booking_date = ? AND status NOT IN ('cancelled') AND helper_id IS NOT NULL
               AND start_time < ? AND end_time > ?
           )`,
        [serviceId, bookingDate, endTime, startTime]
      );
      const availableHelperCount = Number(availRows[0].cnt);

      const bookingId = await BookingModel.create({
        customerId: customerProfile.customer_id,
        helperId: helperId || null,
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

      // Geocode địa chỉ booking bất đồng bộ để hỗ trợ tính năng lọc helper gần đây
      geocodeAddress(address).then(async (coords) => {
        if (coords) {
          await pool.query(
            'UPDATE bookings SET latitude = ?, longitude = ? WHERE booking_id = ?',
            [coords.lat, coords.lng, bookingId]
          );
        }
      }).catch(() => {});

      // Broadcast thông báo đến tất cả helpers available + verified + có đăng ký dịch vụ này
      const svcName = serviceRows[0].service_name;
      pool.query(
        `SELECT DISTINCT h.helper_id, u.user_id
         FROM helpers h
         JOIN users u ON h.user_id = u.user_id
         JOIN helper_services hs ON h.helper_id = hs.helper_id
         WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?`,
        [serviceId]
      ).then(async ([helperRows]) => {
        for (const h of helperRows) {
          await pushNotification({
            userId: h.user_id,
            title: 'Có đơn đặt lịch mới!',
            body: `${svcName} · ${bookingDate} ${startTime}–${endTime}`,
            type: 'booking_new',
            refId: bookingId,
          });
          emitToUser(h.user_id, 'new_job', { bookingId, svcName, bookingDate, startTime, endTime });
        }
      }).catch(() => {});

      const message = availableHelperCount > 0
        ? 'Đặt lịch thành công! Đơn đã được đăng lên hệ thống, người giúp việc sẽ nhận đơn sớm.'
        : 'Đặt lịch thành công! Hiện chưa có người giúp việc rảnh trong khung giờ này. Chúng tôi sẽ thông báo ngay khi có nhân viên phù hợp.';

      return sendSuccess(res, {
        bookingId,
        availableHelperCount,
        summary: { hours, basePrice, discountAmount, totalPrice },
      }, message, 201);
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
      return sendSuccess(res, bookings.map(mapBooking));
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
      return sendSuccess(res, bookings.map(mapBooking));
    } catch (error) {
      next(error);
    }
  },

  // Xem chi tiết booking
  getBookingDetail: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      // Kiểm tra xem customer đã review booking này chưa
      const [[reviewRow]] = await pool.query(
        'SELECT COUNT(*) AS cnt FROM reviews WHERE booking_id = ?',
        [bookingId]
      );
      booking.has_reviewed = (reviewRow.cnt > 0);

      return sendSuccess(res, mapBooking(booking));
    } catch (error) {
      next(error);
    }
  },

  // Helper xác nhận nhận đơn (pending -> confirmed)
  confirmBooking: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0] || helperRows[0].helper_id !== booking.helper_id) {
        return sendError(res, 'Bạn không có quyền xác nhận đơn này.', 403);
      }

      assertValidTransition(booking.status, 'confirmed');
      await BookingModel.updateStatus(bookingId, 'confirmed', user_id, 'Helper xác nhận nhận đơn');

      pushNotification({
        userId: booking.customer_user_id,
        title: `Đơn ${bookingId} đã được xác nhận`,
        body: `${booking.helper_name} đã nhận đơn của bạn vào ngày ${booking.booking_date}`,
        type: 'booking_confirmed',
        refId: bookingId,
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'confirmed' });

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

      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0] || helperRows[0].helper_id !== booking.helper_id) {
        return sendError(res, 'Bạn không có quyền check-in đơn này.', 403);
      }

      assertValidTransition(booking.status, 'in_progress');
      await BookingModel.updateStatus(bookingId, 'in_progress', user_id, 'Helper đã check-in');

      pushNotification({
        userId: booking.customer_user_id,
        title: `Người giúp việc đã check-in ${bookingId}`,
        body: `${booking.helper_name} đã bắt đầu công việc tại nhà bạn`,
        type: 'checkin',
        refId: bookingId,
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'in_progress' });

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

      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0] || helperRows[0].helper_id !== booking.helper_id) {
        return sendError(res, 'Bạn không có quyền check-out đơn này.', 403);
      }

      assertValidTransition(booking.status, 'completed');
      await BookingModel.updateStatus(bookingId, 'completed', user_id, 'Helper đã check-out - hoàn thành công việc');

      pushNotification({
        userId: booking.customer_user_id,
        title: `Đơn ${bookingId} đã hoàn thành`,
        body: `${booking.helper_name} đã hoàn thành công việc. Vui lòng xác nhận thanh toán.`,
        type: 'checkout',
        refId: bookingId,
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'completed' });

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

      if (user_type === 'customer') {
        const customerProfile = await UserModel.getCustomerProfile(user_id);
        if (!customerProfile || customerProfile.customer_id !== booking.customer_id) {
          return sendError(res, 'Bạn không có quyền hủy đơn này.', 403);
        }
      }

      assertValidTransition(booking.status, 'cancelled');
      await BookingModel.updateStatus(bookingId, 'cancelled', user_id, reason || 'Khách hàng hủy đơn');

      // Thông báo cho bên còn lại
      const notifyUserId = user_type === 'customer' ? booking.helper_user_id : booking.customer_user_id;
      if (notifyUserId) {
        pushNotification({
          userId: notifyUserId,
          title: `Đơn ${bookingId} đã bị hủy`,
          body: user_type === 'customer' ? 'Khách hàng đã hủy đơn này' : 'Admin đã hủy đơn này',
          type: 'booking_cancelled',
          refId: bookingId,
        });
        emitToUser(notifyUserId, 'booking:update', { bookingId: parseInt(bookingId), status: 'cancelled' });
      }

      return sendSuccess(res, null, 'Đã hủy đơn hàng.');
    } catch (error) {
      if (error.statusCode === 422) return sendError(res, error.message, 422);
      next(error);
    }
  },

  // Helper xem danh sách việc có thể nhận (open market + được yêu cầu đích danh)
  getAvailableJobs: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [helperRows] = await pool.query(
        'SELECT helper_id, is_verified FROM helpers WHERE user_id = ?',
        [user_id]
      );
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);
      if (!helperRows[0].is_verified) return sendError(res, 'Tài khoản chưa được Admin xác minh.', 403);

      const jobs = await BookingModel.findAvailableJobsForHelper(helperRows[0].helper_id);
      return sendSuccess(res, jobs.map(mapBooking));
    } catch (error) {
      next(error);
    }
  },

  // Helper nhận việc từ job board (gán helper_id + pending → confirmed, atomic)
  acceptJob: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      const [helperRows] = await pool.query(
        'SELECT helper_id, is_verified FROM helpers WHERE user_id = ?',
        [user_id]
      );
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);
      if (!helperRows[0].is_verified) return sendError(res, 'Tài khoản chưa được Admin xác minh.', 403);

      const { helper_id } = helperRows[0];

      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);
      if (booking.status !== 'pending') return sendError(res, 'Booking này không còn khả dụng.', 409);

      // Nếu booking đã yêu cầu đích danh helper khác → từ chối
      if (booking.helper_id && booking.helper_id !== helper_id) {
        return sendError(res, 'Booking này đã được yêu cầu đích danh cho người giúp việc khác.', 403);
      }

      // Kiểm tra xung đột giờ trước khi commit
      const hasConflict = await BookingModel.checkHelperConflict(
        helper_id, booking.booking_date, booking.start_time, booking.end_time, parseInt(bookingId)
      );
      if (hasConflict) return sendError(res, 'Bạn đã có lịch trong khung giờ này.', 409);

      // Gán helper và chuyển sang confirmed (FOR UPDATE tránh race condition)
      await BookingModel.assignHelperAndConfirm(parseInt(bookingId), helper_id, user_id);

      pushNotification({
        userId: booking.customer_user_id,
        title: `Đơn ${bookingId} đã được nhận`,
        body: `Người giúp việc đã nhận đơn của bạn vào ngày ${booking.booking_date}`,
        type: 'booking_confirmed',
        refId: parseInt(bookingId),
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'confirmed' });

      return sendSuccess(res, null, 'Nhận việc thành công!');
    } catch (error) {
      if (error.statusCode === 409) return sendError(res, error.message, 409);
      next(error);
    }
  },

  // Khách hàng lấy danh sách helper đã từng hoàn thành booking (để yêu cầu lại)
  getPreviousHelpers: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);
      const helpers = await BookingModel.findPreviousHelpers(customerProfile.customer_id);
      return sendSuccess(res, helpers);
    } catch (error) {
      next(error);
    }
  },
};

// Xác minh mã khuyến mãi trước khi đặt lịch (preview discount)
const validatePromoCode = async (req, res, next) => {
  try {
    const { code, amount } = req.query;
    const { user_id } = req.user;

    if (!code) return sendError(res, 'Vui lòng nhập mã khuyến mãi.', 400);
    const baseAmount = parseFloat(amount) || 0;

    const [promoRows] = await pool.query(
      `SELECT * FROM promotions
       WHERE code = ? AND is_active = TRUE
         AND start_date <= CURDATE() AND end_date >= CURDATE()
         AND (max_uses IS NULL OR used_count < max_uses)`,
      [code]
    );
    if (!promoRows[0]) return sendError(res, 'Mã khuyến mãi không hợp lệ hoặc đã hết hạn.', 400);

    const promo = promoRows[0];

    if (baseAmount > 0 && baseAmount < promo.min_order_value) {
      return sendError(
        res,
        `Đơn hàng tối thiểu ${Number(promo.min_order_value).toLocaleString('vi-VN')}đ để dùng mã này.`,
        400
      );
    }

    const [usageRows] = await pool.query(
      'SELECT COUNT(*) AS cnt FROM promotion_usage WHERE promo_id = ? AND user_id = ?',
      [promo.promo_id, user_id]
    );
    if (usageRows[0].cnt >= promo.max_uses_per_user) {
      return sendError(res, 'Bạn đã sử dụng hết lượt dùng mã này.', 400);
    }

    const { calculateDiscount } = require('../utils/pricing');
    const discountAmount = baseAmount > 0 ? calculateDiscount(baseAmount, promo) : 0;

    const discountLabel = promo.discount_type === 'percentage'
      ? `Giảm ${promo.discount_value}%${promo.max_discount ? ` (tối đa ${Number(promo.max_discount).toLocaleString('vi-VN')}đ)` : ''}`
      : `Giảm ${Number(promo.discount_value).toLocaleString('vi-VN')}đ`;

    return sendSuccess(res, {
      promoId: promo.promo_id,
      title: promo.title,
      discountAmount,
      discountLabel,
    }, 'Mã khuyến mãi hợp lệ!');
  } catch (error) {
    next(error);
  }
};

// Preview giá đặt lịch trước khi xác nhận (dùng giá hiệu dụng từ backend)
const pricePreview = async (req, res, next) => {
  try {
    const { helperId, serviceId, startTime, endTime, promoCode } = req.query;
    if (!serviceId || !startTime || !endTime) {
      return sendError(res, 'Thiếu serviceId, startTime hoặc endTime.', 400);
    }

    const [serviceRows] = await pool.query('SELECT * FROM services WHERE service_id = ? AND is_active = 1', [serviceId]);
    if (!serviceRows[0]) return sendError(res, 'Dịch vụ không tồn tại.', 400);

    let effectiveRate = parseFloat(serviceRows[0].base_price);
    let experienceLevel = 'beginner';

    if (helperId) {
      const [hsRows] = await pool.query(
        'SELECT custom_price, experience_level FROM helper_services WHERE helper_id = ? AND service_id = ?',
        [helperId, serviceId]
      );
      if (hsRows[0]) {
        experienceLevel = hsRows[0].experience_level || 'beginner';
        effectiveRate = getEffectiveRate(effectiveRate, hsRows[0].custom_price, experienceLevel);
      }
    }

    let promo = null;
    if (promoCode) {
      const [promoRows] = await pool.query(
        `SELECT * FROM promotions WHERE code = ? AND is_active = TRUE
           AND start_date <= CURDATE() AND end_date >= CURDATE()
           AND (max_uses IS NULL OR used_count < max_uses)`,
        [promoCode]
      );
      promo = promoRows[0] || null;
    }

    const { hours, basePrice, discountAmount, totalPrice } = calculateBookingPrice(
      startTime, endTime, effectiveRate, promo
    );

    return sendSuccess(res, { hours, basePrice, discountAmount, totalPrice, effectiveRate, experienceLevel });
  } catch (error) {
    next(error);
  }
};

// Gợi ý và xếp hạng helper phù hợp theo dịch vụ + thời gian (thuật toán matching)
const suggestHelpers = async (req, res, next) => {
  try {
    const { serviceId, bookingDate, startTime, endTime } = req.query;
    if (!serviceId) return sendError(res, 'Thiếu serviceId.', 400);

    const [serviceRows] = await pool.query('SELECT base_price FROM services WHERE service_id = ? AND is_active = 1', [serviceId]);
    if (!serviceRows[0]) return sendError(res, 'Dịch vụ không tồn tại.', 400);

    const basePrice = parseFloat(serviceRows[0].base_price);
    const helpers = await findSuggestedHelpers({ serviceId, bookingDate, startTime, endTime });

    const result = helpers.map(h => ({
      helperId:       h.helper_id,
      fullName:       h.full_name,
      avatarUrl:      h.avatar_url,
      ratingAverage:  h.rating_average,
      totalBookings:  h.total_bookings,
      experienceYears: h.experience_years,
      experienceLevel: h.experience_level,
      isAvailable:    h.is_available,
      isVerified:     h.is_verified,
      effectivePrice: getEffectiveRate(basePrice, h.custom_price, h.experience_level),
      score:          h.score,
      bio:            h.bio,
    }));

    return sendSuccess(res, { helpers: result, total: result.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { ...BookingController, assertValidTransition, VALID_TRANSITIONS, validatePromoCode, pricePreview, suggestHelpers };
