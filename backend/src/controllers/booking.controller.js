// Controller đặt lịch - tích hợp logic tính giá tập trung và kiểm tra xung đột lịch
const BookingModel = require('../models/booking.model');
const UserModel = require('../models/user.model');
const PaymentModel = require('../models/payment.model');
const { pool } = require('../config/database');
const { calculateBookingPrice, getEffectiveRate } = require('../utils/pricing');
const { findSuggestedHelpers } = require('../utils/matching');
const { getCustomerTrustInfo } = require('../utils/customerTrust');
const { geocodeAddress } = require('../utils/geocode');
const { sendSuccess, sendError } = require('../utils/response');
const { pushNotification, mailIfOffline } = require('../utils/notify');
const { emitToUser } = require('../socket');
const {
  sendBookingCreatedEmail,
  sendBookingConfirmedEmail,
  sendHelperConfirmedEmail,
  sendCheckinEmail,
  sendCompletedEmail,
  sendHelperCompletedEmail,
  sendCancelledEmail,
  sendCancellationReceiptEmail,
  sendNewJobEmail,
  sendJobAcceptedEmail,
} = require('../utils/email');

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
    depositAmount:  b.deposit_amount ? Number(b.deposit_amount) : null,
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
      const { helperId, serviceId, promoCode, bookingDate, startTime, endTime, address, note, paymentMethod, lat, lng } = req.body;

      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      // Kiểm tra uy tín khách hàng để đảm bảo phương thức thanh toán hợp lệ
      const trustInfo = await getCustomerTrustInfo(customerProfile.customer_id);
      const resolvedPaymentMethod = paymentMethod || customerProfile.preferred_payment;
      if (trustInfo.requiresOnlinePayment && resolvedPaymentMethod === 'cash') {
        const reason = trustInfo.isNewCustomer
          ? 'Lần đầu đặt lịch, bạn cần thanh toán online (VNPay) để xác nhận cam kết và tránh đặt lịch ảo.'
          : `Tỷ lệ hoàn thành đơn của bạn đang thấp (${trustInfo.completionRatePercent}%). Vui lòng thanh toán online (VNPay) để đặt lịch.`;
        return sendError(res, reason, 403);
      }

      // Không cho đặt lịch ngày/giờ trong quá khứ (dùng timezone Việt Nam UTC+7)
      const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
      const nowVN      = new Date(Date.now() + VN_OFFSET_MS);
      const todayVN    = nowVN.toISOString().slice(0, 10); // "YYYY-MM-DD"
      const nowVNHour  = nowVN.getUTCHours();
      const nowVNMin   = nowVN.getUTCMinutes();

      if (bookingDate < todayVN)
        return sendError(res, 'Không thể đặt lịch cho ngày đã qua. Vui lòng chọn ngày hôm nay hoặc tương lai.', 400);

      if (bookingDate === todayVN) {
        const [sh, sm]   = startTime.split(':').map(Number);
        const startMins  = sh * 60 + sm;
        const nowMins    = nowVNHour * 60 + nowVNMin;
        if (startMins < nowMins) {
          const nowH = String(nowVNHour).padStart(2, '0');
          const nowM = String(nowVNMin).padStart(2, '0');
          return sendError(res, `Giờ bắt đầu đã qua (hiện tại ${nowH}:${nowM}). Vui lòng chọn khung giờ khác.`, 400);
        }
      }

      // Kiểm tra xung đột lịch của khách hàng (tránh đặt 2 đơn cùng khung giờ)
      const customerHasConflict = await BookingModel.checkCustomerConflict(
        customerProfile.customer_id, bookingDate, startTime, endTime
      );
      if (customerHasConflict) return sendError(res, `Bạn đã có đơn đặt lịch khác vào ngày ${bookingDate} lúc ${startTime}–${endTime}. Vui lòng chọn khung giờ khác hoặc kiểm tra lịch của bạn.`, 409);

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

        // Dùng custom_price nếu helper đã cài (không nhân hệ số kinh nghiệm)
        helperRate = getEffectiveRate(helperRate, helper.custom_price);

        // Kiểm tra xung đột lịch làm việc của helper
        const hasConflict = await BookingModel.checkHelperConflict(helperId, bookingDate, startTime, endTime);
        if (hasConflict) return sendError(res, 'Người giúp việc này đã có lịch làm khác trong khung giờ bạn chọn. Bạn có thể đặt không chỉ định người giúp việc để hệ thống tự tìm người phù hợp.', 409);
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
         JOIN users u ON h.user_id = u.user_id
         JOIN helper_services hs ON h.helper_id = hs.helper_id
         WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
           AND u.user_type != 'admin'
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
        changedByUserId: user_id,
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

      // Gửi email xác nhận đặt lịch nếu khách hàng đang offline
      const [customerUserRows] = await pool.query('SELECT email, full_name FROM users WHERE user_id = ?', [user_id]);
      if (customerUserRows[0]) {
        const svcNameForEmail = serviceRows[0].service_name;
        mailIfOffline(user_id, () => sendBookingCreatedEmail(customerUserRows[0].email, customerUserRows[0].full_name, {
          bookingId, serviceName: svcNameForEmail, bookingDate, startTime, endTime,
          address, totalPrice,
        }));
      }

      // Pha 1: geocode đồng bộ để phân loại helper theo khoảng cách
      const svcName = serviceRows[0].service_name;
      const { haversineDistance } = require('../utils/geocode');

      (async () => {
        try {
          // Nếu booking yêu cầu helper cụ thể → chỉ notify đúng helper đó
          if (helperId) {
            const [[specificHelper]] = await pool.query(
              `SELECT h.helper_id, u.user_id, u.email, u.full_name
               FROM helpers h JOIN users u ON h.user_id = u.user_id
               WHERE h.helper_id = ?`,
              [helperId]
            );
            if (specificHelper) {
              await pushNotification({
                userId: specificHelper.user_id,
                title: '⭐ Khách hàng yêu cầu bạn!',
                body: `${svcName} · ${bookingDate} ${startTime}–${endTime}`,
                type: 'booking_new',
                refId: bookingId,
              });
              emitToUser(specificHelper.user_id, 'new_job', { bookingId, svcName, bookingDate, startTime, endTime });
              if (specificHelper.email) {
                mailIfOffline(specificHelper.user_id, () => sendNewJobEmail(specificHelper.email, specificHelper.full_name, {
                  bookingId, serviceName: svcName, bookingDate, startTime, endTime, address,
                }));
              }
            }
            return;
          }

          // Đặt mở: lấy toàn bộ helpers hợp lệ kèm tọa độ để phân giai đoạn
          const [helperRows] = await pool.query(
            `SELECT DISTINCT h.helper_id, u.user_id, u.email, u.full_name,
                    h.rating_average, h.latitude, h.longitude
             FROM helpers h
             JOIN users u ON h.user_id = u.user_id
             JOIN helper_services hs ON h.helper_id = hs.helper_id
             WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
               AND u.user_type != 'admin'`,
            [serviceId]
          );

          // Ưu tiên dùng GPS từ client (chính xác hơn geocode), fallback sang geocodeAddress
          let bookingLat = null, bookingLng = null;
          if (lat && lng) {
            bookingLat = parseFloat(lat); bookingLng = parseFloat(lng);
            await pool.query(
              'UPDATE bookings SET latitude = ?, longitude = ? WHERE booking_id = ?',
              [bookingLat, bookingLng, bookingId]
            );
          } else {
            const coords = await geocodeAddress(address);
            if (coords) {
              bookingLat = coords.lat; bookingLng = coords.lng;
              await pool.query(
                'UPDATE bookings SET latitude = ?, longitude = ? WHERE booking_id = ?',
                [bookingLat, bookingLng, bookingId]
              );
            }
          }

          // Phân loại: gần (≤5km) → giai đoạn 1, xa hơn → giai đoạn 2
          const nearby = [], faraway = [];
          for (const h of helperRows) {
            const hLat = h.latitude ? parseFloat(h.latitude) : null;
            const hLng = h.longitude ? parseFloat(h.longitude) : null;
            const dist = (bookingLat && bookingLng && hLat && hLng)
              ? haversineDistance(bookingLat, bookingLng, hLat, hLng)
              : null;
            (dist !== null && dist <= 5 ? nearby : faraway).push({ ...h, distKm: dist });
          }

          nearby.sort((a, b) => b.rating_average - a.rating_average);

          const phase1 = nearby.length > 0 ? nearby : helperRows;
          for (const h of phase1) {
            await pushNotification({
              userId: h.user_id,
              title: nearby.length > 0 ? '📍 Có đơn mới gần bạn!' : 'Có đơn đặt lịch mới!',
              body: `${svcName} · ${bookingDate} ${startTime}–${endTime}`,
              type: 'booking_new',
              refId: bookingId,
            });
            emitToUser(h.user_id, 'new_job', { bookingId, svcName, bookingDate, startTime, endTime, nearby: true });
            if (h.email) {
              mailIfOffline(h.user_id, () => sendNewJobEmail(h.email, h.full_name, {
                bookingId, serviceName: svcName, bookingDate, startTime, endTime, address,
              }));
            }
          }

          // Gửi giai đoạn 2 cho helpers xa hơn sau 10 phút (nếu có)
          if (nearby.length > 0 && faraway.length > 0) {
            setTimeout(async () => {
              const [[bk]] = await pool.query(
                'SELECT status FROM bookings WHERE booking_id = ?', [bookingId]
              );
              if (!bk || bk.status !== 'pending') return;
              for (const h of faraway) {
                await pushNotification({
                  userId: h.user_id,
                  title: 'Có đơn đặt lịch mới!',
                  body: `${svcName} · ${bookingDate} ${startTime}–${endTime}`,
                  type: 'booking_new',
                  refId: bookingId,
                });
                emitToUser(h.user_id, 'new_job', { bookingId, svcName, bookingDate, startTime, endTime });
                if (h.email) {
                  mailIfOffline(h.user_id, () => sendNewJobEmail(h.email, h.full_name, {
                    bookingId, serviceName: svcName, bookingDate, startTime, endTime, address,
                  }));
                }
              }
            }, 10 * 60 * 1000);
          }
        } catch (err) {
          console.error('Phase-1 notification error:', err.message);
        }
      })();

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

      const bookingInfoConfirm = {
        bookingId, serviceName: booking.service_name, bookingDate: booking.booking_date,
        startTime: booking.start_time, endTime: booking.end_time,
        address: booking.address, totalPrice: booking.total_price,
      };
      if (booking.customer_email) {
        mailIfOffline(booking.customer_user_id, () => sendBookingConfirmedEmail(booking.customer_email, booking.customer_name, bookingInfoConfirm, booking.helper_name));
      }
      if (booking.helper_email) {
        mailIfOffline(booking.helper_user_id, () => sendHelperConfirmedEmail(booking.helper_email, booking.helper_name, bookingInfoConfirm, booking.customer_name));
      }

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
      const { lat, lng } = req.body;
      const gps = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
      await BookingModel.updateStatus(bookingId, 'in_progress', user_id, 'Helper đã check-in', gps);

      pushNotification({
        userId: booking.customer_user_id,
        title: `Người giúp việc đã check-in ${bookingId}`,
        body: `${booking.helper_name} đã bắt đầu công việc tại nhà bạn`,
        type: 'checkin',
        refId: bookingId,
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'in_progress' });

      if (booking.customer_email) {
        mailIfOffline(booking.customer_user_id, () => sendCheckinEmail(booking.customer_email, booking.customer_name, {
          bookingId, serviceName: booking.service_name, bookingDate: booking.booking_date,
          startTime: booking.start_time, endTime: booking.end_time, address: booking.address,
        }, booking.helper_name));
      }

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
      const { lat, lng } = req.body;
      const gps = (lat && lng) ? { lat: parseFloat(lat), lng: parseFloat(lng) } : null;
      await BookingModel.updateStatus(bookingId, 'completed', user_id, 'Helper đã check-out - hoàn thành công việc', gps);

      // Tự động xác nhận thanh toán cho đơn tiền mặt → cập nhật ví helper ngay lập tức
      const payment = await PaymentModel.findByBooking(bookingId);
      if (payment && payment.payment_status === 'unpaid' && payment.payment_method === 'cash') {
        await PaymentModel.confirmPayment(bookingId, null);
      } else if (payment && payment.payment_status === 'deposit_paid') {
        // Đơn có đặt cọc 70% online, còn lại 30% thu tiền mặt trực tiếp
        await PaymentModel.confirmRemainingPayment(bookingId, 'cash', null);
      }

      pushNotification({
        userId: booking.customer_user_id,
        title: `Đơn ${bookingId} đã hoàn thành`,
        body: `${booking.helper_name} đã hoàn thành công việc.`,
        type: 'checkout',
        refId: bookingId,
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'completed' });

      const bookingInfoDone = {
        bookingId, serviceName: booking.service_name, bookingDate: booking.booking_date,
        startTime: booking.start_time, endTime: booking.end_time,
        address: booking.address, totalPrice: booking.total_price,
      };
      if (booking.customer_email) {
        mailIfOffline(booking.customer_user_id, () => sendCompletedEmail(booking.customer_email, booking.customer_name, bookingInfoDone, booking.helper_name));
      }
      if (booking.helper_email) {
        mailIfOffline(booking.helper_user_id, () => sendHelperCompletedEmail(booking.helper_email, booking.helper_name, bookingInfoDone, booking.customer_name));
      }

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

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        await conn.query(
          `UPDATE bookings SET status = 'cancelled', updated_at = NOW() WHERE booking_id = ?`,
          [bookingId]
        );
        await conn.query(
          `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
           VALUES (?, ?, ?, 'cancelled', ?)`,
          [bookingId, user_id, booking.status, reason || 'Khách hàng hủy đơn']
        );

        // Xử lý hoàn tiền / tịch thu cọc khi hủy đơn
        const [[paymentRow]] = await conn.query(
          'SELECT payment_status, deposit_amount FROM payments WHERE booking_id = ?',
          [bookingId]
        );

        if (paymentRow && paymentRow.payment_status === 'paid') {
          // Đã thanh toán đầy đủ → hoàn tiền
          await conn.query(
            `UPDATE payments SET payment_status = 'refund_pending' WHERE booking_id = ?`,
            [bookingId]
          );
          await conn.query(
            `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
             VALUES (?, ?, 'cancelled', 'cancelled', ?)`,
            [bookingId, user_id, 'Hoàn tiền tự động khi hủy đơn']
          );
        } else if (paymentRow && paymentRow.payment_status === 'deposit_paid') {
          const helperAlreadyAccepted = ['confirmed', 'in_progress'].includes(booking.status);

          if (helperAlreadyAccepted) {
            // Khách bom lịch sau khi helper đã nhận → tịch thu cọc, chuyển cho helper
            const depositAmount = Number(paymentRow.deposit_amount || 0);
            const [[helperRow]] = await conn.query(
              `SELECT h.user_id AS helper_user_id
               FROM bookings b JOIN helpers h ON h.helper_id = b.helper_id
               WHERE b.booking_id = ?`,
              [bookingId]
            );
            if (helperRow?.helper_user_id && depositAmount > 0) {
              await conn.query(
                `INSERT IGNORE INTO wallets (user_id, balance, total_earned, total_withdrawn)
                 VALUES (?, 0, 0, 0)`,
                [helperRow.helper_user_id]
              );
              const [[w]] = await conn.query(
                'SELECT wallet_id, balance FROM wallets WHERE user_id = ?',
                [helperRow.helper_user_id]
              );
              const balanceAfter = Number(w.balance) + depositAmount;
              await conn.query(
                `INSERT INTO wallet_transactions
                   (wallet_id, type, amount, balance_after, source, booking_id, description)
                 VALUES (?, 'credit', ?, ?, 'booking_payment', ?, ?)`,
                [w.wallet_id, depositAmount, balanceAfter, bookingId,
                 `Tiền bồi thường đi lại — khách bom lịch đơn #${bookingId}`]
              );
            }
            await conn.query(
              `UPDATE payments SET payment_status = 'deposit_forfeited' WHERE booking_id = ?`,
              [bookingId]
            );
            await conn.query(
              `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
               VALUES (?, ?, 'cancelled', 'cancelled', ?)`,
              [bookingId, user_id, 'Tiền cọc chuyển cho helper — khách hủy sau khi helper đã nhận đơn']
            );
          } else {
            // Chưa có helper nào nhận → hoàn cọc cho khách
            await conn.query(
              `UPDATE payments SET payment_status = 'refund_pending' WHERE booking_id = ?`,
              [bookingId]
            );
            await conn.query(
              `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
               VALUES (?, ?, 'cancelled', 'cancelled', ?)`,
              [bookingId, user_id, 'Khởi tạo hoàn cọc 70% — khách hủy trước khi có helper nhận đơn']
            );
          }
        }

        await conn.commit();
      } catch (txErr) {
        await conn.rollback();
        throw txErr;
      } finally {
        conn.release();
      }

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

      // Gửi email cho cả 2 bên khi hủy
      const bookingInfoCancel = {
        bookingId, serviceName: booking.service_name, bookingDate: booking.booking_date,
        startTime: booking.start_time, endTime: booking.end_time, address: booking.address,
      };
      const cancelledBy = user_type === 'customer' ? booking.customer_name : 'Quản trị viên';

      if (user_type === 'customer') {
        // Customer hủy: gửi xác nhận cho customer + thông báo cho helper
        if (booking.customer_email) {
          mailIfOffline(booking.customer_user_id, () => sendCancellationReceiptEmail(booking.customer_email, booking.customer_name, bookingInfoCancel));
        }
        if (booking.helper_email) {
          mailIfOffline(booking.helper_user_id, () => sendCancelledEmail(booking.helper_email, booking.helper_name, bookingInfoCancel, cancelledBy));
        }
      } else {
        // Admin hủy: thông báo cho cả khách hàng và helper
        if (booking.customer_email) {
          mailIfOffline(booking.customer_user_id, () => sendCancelledEmail(booking.customer_email, booking.customer_name, bookingInfoCancel, cancelledBy));
        }
        if (booking.helper_email) {
          mailIfOffline(booking.helper_user_id, () => sendCancelledEmail(booking.helper_email, booking.helper_name, bookingInfoCancel, cancelledBy));
        }
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
      if (!helperRows[0].is_verified) return sendError(res, 'Tài khoản của bạn chưa được Admin xác minh. Vui lòng liên hệ hỗ trợ qua mục Phản hồi để được kích hoạt.', 403);

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
      if (!helperRows[0].is_verified) return sendError(res, 'Tài khoản của bạn chưa được Admin xác minh. Vui lòng liên hệ hỗ trợ qua mục Phản hồi để được kích hoạt.', 403);

      const { helper_id } = helperRows[0];

      const booking = await BookingModel.findById(bookingId);
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);
      if (booking.status !== 'pending') return sendError(res, `Đơn #${bookingId} không còn khả dụng (trạng thái hiện tại: ${booking.status}). Có thể đơn đã được người khác nhận hoặc khách hàng đã hủy. Vui lòng làm mới danh sách.`, 409);

      // Nếu booking đã yêu cầu đích danh helper khác → từ chối
      if (booking.helper_id && booking.helper_id !== helper_id) {
        return sendError(res, 'Booking này đã được yêu cầu đích danh cho người giúp việc khác.', 403);
      }

      // Kiểm tra xung đột giờ trước khi commit
      const hasConflict = await BookingModel.checkHelperConflict(
        helper_id, booking.booking_date, booking.start_time, booking.end_time, parseInt(bookingId)
      );
      if (hasConflict) return sendError(res, `Bạn đã có lịch làm khác vào ngày ${booking.booking_date} lúc ${String(booking.start_time).slice(0,5)}–${String(booking.end_time).slice(0,5)}. Vui lòng kiểm tra lịch làm việc của bạn trước khi nhận đơn này.`, 409);

      // Kiểm tra quy tắc nghỉ 30 phút giữa các ca
      const hasGapViolation = await BookingModel.checkHelperGapRule(
        helper_id, booking.booking_date, booking.start_time, booking.end_time, parseInt(bookingId)
      );
      if (hasGapViolation) {
        return sendError(res, 'Cần nghỉ ít nhất 30 phút giữa các ca làm. Vui lòng kiểm tra lịch của bạn.', 409);
      }

      // Gán helper và chuyển sang confirmed (FOR UPDATE tránh race condition)
      await BookingModel.assignHelperAndConfirm(parseInt(bookingId), helper_id, user_id);

      // Lấy tên helper từ bảng users (booking.helper_name null vì fetch trước khi assign)
      const [helperUserRows] = await pool.query('SELECT full_name FROM users WHERE user_id = ?', [user_id]);
      const helperDisplayName = helperUserRows[0]?.full_name || 'Người giúp việc';

      const acceptTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' });
      pushNotification({
        userId: booking.customer_user_id,
        title: `${helperDisplayName} đã nhận đơn hàng #${bookingId}`,
        body: `Lúc ${acceptTime} — Vui lòng xem lại đơn đặt lịch của bạn.`,
        type: 'booking_confirmed',
        refId: parseInt(bookingId),
      });
      emitToUser(booking.customer_user_id, 'booking:update', { bookingId: parseInt(bookingId), status: 'confirmed' });

      // Luôn gửi email xác nhận nhận đơn (không phụ thuộc online/offline)
      if (booking.customer_email) {
        sendJobAcceptedEmail(
          booking.customer_email, booking.customer_name,
          {
            bookingId, serviceName: booking.service_name, bookingDate: booking.booking_date,
            startTime: booking.start_time, endTime: booking.end_time,
            address: booking.address, totalPrice: booking.total_price,
          },
          helperDisplayName
        ).catch(() => {});
      }

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

  // Khách hàng xem thông tin uy tín của tài khoản (tỷ lệ hoàn thành, có được dùng tiền mặt không)
  getMyTrustInfo: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);
      const trustInfo = await getCustomerTrustInfo(customerProfile.customer_id);
      return sendSuccess(res, trustInfo);
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
        effectiveRate = getEffectiveRate(effectiveRate, hsRows[0].custom_price);
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

// Kiểm tra xem có helper rảnh không trong khung giờ yêu cầu
// Nếu không có → tìm tối đa 3 khung giờ thay thế trong 7 ngày tới (cùng độ dài)
const checkAvailability = async (req, res, next) => {
  try {
    const { serviceId, bookingDate, startTime, endTime } = req.query;
    if (!serviceId || !bookingDate || !startTime || !endTime)
      return sendError(res, 'Thiếu thông tin kiểm tra.', 400);

    // Đếm helpers đủ điều kiện và rảnh trong khung giờ yêu cầu
    const [[{ cnt }]] = await pool.query(
      `SELECT COUNT(DISTINCT h.helper_id) AS cnt
       FROM helpers h
       JOIN users u ON h.user_id = u.user_id
       JOIN helper_services hs ON h.helper_id = hs.helper_id
       WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
         AND u.user_type != 'admin'
         AND h.helper_id NOT IN (
           SELECT DISTINCT helper_id FROM bookings
           WHERE booking_date = ? AND status NOT IN ('cancelled') AND helper_id IS NOT NULL
             AND start_time < ? AND end_time > ?
         )`,
      [serviceId, bookingDate, endTime, startTime]
    );

    const availableCount = Number(cnt);
    if (availableCount > 0)
      return sendSuccess(res, { available: true, availableCount, suggestions: [] });

    // Tính số phút của khung giờ gốc để giữ nguyên độ dài khi gợi ý
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const durationMins = (eh * 60 + em) - (sh * 60 + sm);

    // Các khung giờ phổ biến để thử (mỗi bước 1 tiếng)
    const CANDIDATE_STARTS = ['07:00','08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00','17:00'];
    const suggestions = [];
    const baseDate = new Date(bookingDate + 'T00:00:00Z');

    for (let dayOffset = 0; dayOffset <= 6 && suggestions.length < 3; dayOffset++) {
      const d = new Date(baseDate);
      d.setUTCDate(d.getUTCDate() + dayOffset);
      const dateStr = d.toISOString().slice(0, 10);

      for (const slotStart of CANDIDATE_STARTS) {
        if (suggestions.length >= 3) break;

        // Bỏ qua đúng khung giờ khách vừa chọn
        if (dateStr === bookingDate && slotStart === startTime) continue;

        const [hh, mm] = slotStart.split(':').map(Number);
        const endTotalMins = hh * 60 + mm + durationMins;
        const endH = Math.floor(endTotalMins / 60);
        const endM = endTotalMins % 60;
        if (endH >= 22) continue; // không kết thúc sau 22:00

        const slotEnd = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

        const [[{ cnt: slotCnt }]] = await pool.query(
          `SELECT COUNT(DISTINCT h.helper_id) AS cnt
           FROM helpers h
           JOIN users u ON h.user_id = u.user_id
           JOIN helper_services hs ON h.helper_id = hs.helper_id
           WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
             AND u.user_type != 'admin'
             AND h.helper_id NOT IN (
               SELECT DISTINCT helper_id FROM bookings
               WHERE booking_date = ? AND status NOT IN ('cancelled') AND helper_id IS NOT NULL
                 AND start_time < ? AND end_time > ?
             )`,
          [serviceId, dateStr, slotEnd, slotStart]
        );

        if (Number(slotCnt) > 0) {
          suggestions.push({
            bookingDate: dateStr,
            startTime:   slotStart,
            endTime:     slotEnd,
            availableHelpers: Number(slotCnt),
          });
        }
      }
    }

    return sendSuccess(res, { available: false, availableCount: 0, suggestions });
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
      effectivePrice: getEffectiveRate(basePrice, h.custom_price),
      score:          h.score,
      bio:            h.bio,
    }));

    return sendSuccess(res, { helpers: result, total: result.length });
  } catch (error) {
    next(error);
  }
};

// Gợi ý khung giờ thay thế khi đơn bị hủy (auto hoặc thủ công)
// Tìm 3 khung giờ trong 3 ngày tới có ≥1 helper sẵn sàng
const getBookingSuggestions = async (req, res, next) => {
  try {
    const { bookingId } = req.params;

    const [[booking]] = await pool.query(
      `SELECT b.service_id, b.hours, b.start_time, b.end_time, b.booking_date,
              s.service_name
       FROM bookings b JOIN services s ON b.service_id = s.service_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );
    if (!booking) return sendError(res, 'Không tìm thấy đơn hàng.', 404);

    // Kiểm tra các khung giờ phổ biến trong 3 ngày tới
    const SLOTS = ['07:00', '08:00', '09:00', '13:00', '14:00', '15:00'];
    const suggestions = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset <= 3 && suggestions.length < 3; dayOffset++) {
      const d = new Date(today);
      d.setDate(d.getDate() + dayOffset);
      const dateStr = d.toISOString().slice(0, 10);

      for (const slot of SLOTS) {
        if (suggestions.length >= 3) break;

        const [h, m] = slot.split(':').map(Number);
        const endH = h + booking.hours;
        const endSlot = `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (endH > 21) continue; // không làm sau 21:00

        // Đếm helpers có thể nhận slot này
        const [[{ cnt }]] = await pool.query(
          `SELECT COUNT(DISTINCT h.helper_id) AS cnt
           FROM helpers h
           JOIN users u ON h.user_id = u.user_id
           JOIN helper_services hs ON h.helper_id = hs.helper_id
           WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
             AND u.user_type != 'admin'
             AND h.helper_id NOT IN (
               SELECT DISTINCT helper_id FROM bookings
               WHERE booking_date = ? AND status NOT IN ('cancelled') AND helper_id IS NOT NULL
                 AND start_time < ? AND end_time > ?
             )`,
          [booking.service_id, dateStr, endSlot, slot]
        );

        if (Number(cnt) > 0) {
          suggestions.push({
            bookingDate: dateStr,
            startTime: slot,
            endTime: endSlot,
            availableHelpers: Number(cnt),
          });
        }
      }
    }

    return sendSuccess(res, {
      serviceName: booking.service_name,
      hours: booking.hours,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { ...BookingController, assertValidTransition, VALID_TRANSITIONS, validatePromoCode, pricePreview, suggestHelpers, getBookingSuggestions, checkAvailability };
