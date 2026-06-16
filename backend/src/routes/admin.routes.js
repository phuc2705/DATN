// Routes quản trị - chỉ admin mới được truy cập
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Tất cả admin routes yêu cầu đăng nhập + quyền admin
router.use(authenticate, authorize('admin'));

// GET /api/admin/stats/daily?days=30 - Doanh thu từng ngày
router.get('/stats/daily', AdminController.getDailyStats);

// GET /api/admin/stats/weekly?weekOffset=0 - Doanh thu theo ngày trong tuần
router.get('/stats/weekly', AdminController.getWeeklyStats);

// GET /api/admin/stats - Tổng quan dashboard
router.get('/stats', AdminController.getDashboardStats);

// ─── Quản lý User ──────────────────────────────────────────────────────────────
// GET /api/admin/users?userType=helper&isActive=true&search=...
router.get('/users', AdminController.listUsers);

// PATCH /api/admin/users/:userId/status - Kích hoạt / khóa tài khoản
router.patch('/users/:userId/status', [
  body('isActive').isBoolean().withMessage('isActive phải là boolean'),
], validate, AdminController.setUserStatus);

// DELETE /api/admin/users/:userId - Xóa tài khoản
router.delete('/users/:userId', AdminController.deleteUser);

// PATCH /api/admin/helpers/:helperId/verify - Xác minh helper
router.patch('/helpers/:helperId/verify', AdminController.verifyHelper);

// ─── Quản lý Booking ──────────────────────────────────────────────────────────
router.get('/bookings', AdminController.listAllBookings);

// GET /api/admin/bookings/expiring - Đơn pending sắp hết hạn trong 60 phút (để điều phối thủ công)
router.get('/bookings/expiring', async (req, res) => {
  const { pool } = require('../config/database');
  const { sendSuccess } = require('../utils/response');
  const [rows] = await pool.query(`
    SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.created_at,
           b.address, b.total_price, b.timeout_notified,
           s.service_name,
           uc.full_name AS customer_name, uc.phone AS customer_phone,
           CASE
             WHEN b.booking_date = CURDATE()
               THEN TIMESTAMPDIFF(MINUTE, NOW(), DATE_ADD(b.created_at, INTERVAL 2 HOUR))
             ELSE TIMESTAMPDIFF(MINUTE, NOW(), DATE_ADD(b.created_at, INTERVAL 4 HOUR))
           END AS minutes_left,
           CASE
             WHEN b.booking_date = CURDATE() THEN DATE_ADD(b.created_at, INTERVAL 2 HOUR)
             ELSE DATE_ADD(b.created_at, INTERVAL 4 HOUR)
           END AS expires_at
    FROM bookings b
    JOIN services s ON b.service_id = s.service_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN users uc ON c.user_id = uc.user_id
    WHERE b.status = 'pending'
      AND b.helper_id IS NULL
      AND CONCAT(b.booking_date, ' ', b.start_time) > NOW()
      AND CASE
            WHEN b.booking_date = CURDATE()
              THEN DATE_ADD(b.created_at, INTERVAL 2 HOUR)
            ELSE DATE_ADD(b.created_at, INTERVAL 4 HOUR)
          END BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 60 MINUTE)
    ORDER BY minutes_left ASC
    LIMIT 30
  `);
  return sendSuccess(res, rows);
});

router.patch('/bookings/:bookingId/status', AdminController.updateBookingStatus);
// PATCH /api/admin/bookings/:bookingId/assign - Giao việc cho helper
router.patch('/bookings/:bookingId/assign', [
  body('helperId').isInt({ min: 1 }).withMessage('helperId không hợp lệ'),
], validate, AdminController.assignHelper);

// GET /api/admin/helpers/available?bookingId=X - phải đặt TRƯỚC /:helperId để tránh bị bắt nhầm
router.get('/helpers/available', async (req, res) => {
  const { pool } = require('../config/database');
  const { sendSuccess } = require('../utils/response');
  const { haversineDistance, geocodeAddress } = require('../utils/geocode');
  const { bookingId } = req.query;

  // Lấy tất cả helper đã xác minh
  const [helpers] = await pool.query(
    `SELECT h.helper_id, u.full_name, h.hourly_rate, h.rating_average,
            h.is_available, h.latitude, h.longitude, h.address
     FROM helpers h JOIN users u ON h.user_id = u.user_id
     WHERE h.is_verified = 1 AND u.is_active = 1
     ORDER BY h.rating_average DESC`
  );

  if (!bookingId) return sendSuccess(res, helpers);

  // Lấy tọa độ booking
  const [[booking]] = await pool.query(
    'SELECT latitude, longitude, address FROM bookings WHERE booking_id = ?',
    [bookingId]
  );
  if (!booking) return sendSuccess(res, helpers);

  let bookingLat = booking.latitude ? parseFloat(booking.latitude) : null;
  let bookingLng = booking.longitude ? parseFloat(booking.longitude) : null;

  // Nếu booking chưa có tọa độ → geocode ngay
  if (!bookingLat && booking.address) {
    const coords = await geocodeAddress(booking.address);
    if (coords) {
      bookingLat = coords.lat;
      bookingLng = coords.lng;
      await pool.query(
        'UPDATE bookings SET latitude = ?, longitude = ? WHERE booking_id = ?',
        [bookingLat, bookingLng, bookingId]
      );
    }
  }

  // Nếu vẫn không có tọa độ booking → trả về tất cả helper
  if (!bookingLat || !bookingLng) return sendSuccess(res, helpers);

  const RADIUS_KM = 5;

  // Tính khoảng cách và lọc helper trong bán kính 5km
  const nearby = [];
  const farAway = [];

  for (const h of helpers) {
    let hLat = h.latitude ? parseFloat(h.latitude) : null;
    let hLng = h.longitude ? parseFloat(h.longitude) : null;

    // Nếu helper chưa có tọa độ → geocode bất đồng bộ (không block response)
    if (!hLat && h.address) {
      geocodeAddress(h.address).then(async (coords) => {
        if (coords) {
          await pool.query(
            'UPDATE helpers SET latitude = ?, longitude = ? WHERE helper_id = ?',
            [coords.lat, coords.lng, h.helper_id]
          );
        }
      }).catch(() => {});
    }

    if (hLat && hLng) {
      const dist = haversineDistance(bookingLat, bookingLng, hLat, hLng);
      const item = { ...h, distanceKm: Math.round(dist * 10) / 10 };
      if (dist <= RADIUS_KM) {
        nearby.push(item);
      } else {
        farAway.push(item);
      }
    } else {
      farAway.push({ ...h, distanceKm: null });
    }
  }

  // Sắp xếp: gần nhất lên đầu, xa hơn ở cuối (có thể chọn nếu cần)
  nearby.sort((a, b) => a.distanceKm - b.distanceKm);

  return sendSuccess(res, { nearby, farAway, bookingLat, bookingLng });
});

// GET /api/admin/helpers/:helperId - Hồ sơ chi tiết helper (đặt SAU /helpers/available)
router.get('/helpers/:helperId', AdminController.getHelperDetail);

// ─── Quản lý Payment ──────────────────────────────────────────────────────────
// GET /api/admin/payments?status=paid&startDate=...
router.get('/payments', AdminController.listAllPayments);

// ─── Quản lý Dịch vụ ──────────────────────────────────────────────────────────
router.get('/services', AdminController.listServices);
// POST /api/admin/services - Tạo dịch vụ mới
router.post('/services', [
  body('serviceName').trim().notEmpty().withMessage('Tên dịch vụ không được để trống'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Giá không hợp lệ'),
], validate, AdminController.createService);
// PUT /api/admin/services/:serviceId
router.put('/services/:serviceId', [
  body('serviceName').optional().trim().notEmpty(),
  body('basePrice').optional().isFloat({ min: 0 }),
], validate, AdminController.updateService);

// DELETE /api/admin/services/:serviceId (soft delete / toggle off)
router.delete('/services/:serviceId', AdminController.deleteService);

// PATCH /api/admin/services/:serviceId/toggle (bật lại dịch vụ đã ẩn)
router.patch('/services/:serviceId/toggle', AdminController.toggleServiceStatus);

// ─── Quản lý Khuyến mãi ───────────────────────────────────────────────────────
// GET /api/admin/promotions
router.get('/promotions', AdminController.listPromotions);

// POST /api/admin/promotions
router.post('/promotions', [
  body('code').trim().notEmpty().withMessage('Mã không được để trống'),
  body('discountType').isIn(['percentage', 'fixed']).withMessage('Loại giảm giá không hợp lệ'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Giá trị giảm không hợp lệ'),
  body('startDate').isDate().withMessage('Ngày bắt đầu không hợp lệ'),
  body('endDate').isDate().withMessage('Ngày kết thúc không hợp lệ'),
], validate, AdminController.createPromotion);

// PATCH /api/admin/promotions/:promoId
router.patch('/promotions/:promoId', AdminController.updatePromotion);

// DELETE /api/admin/promotions/:promoId
router.delete('/promotions/:promoId', AdminController.deletePromotion);

// ─── Quản lý Đánh giá ────────────────────────────────────────────────────────
router.get('/reviews', AdminController.listReviews);
router.patch('/reviews/:reviewId/visibility', AdminController.toggleReviewVisibility);
router.delete('/reviews/:reviewId', AdminController.deleteReview);

// ─── Quản lý Phản hồi hệ thống ───────────────────────────────────────────────
const FeedbackController = require('../controllers/feedback.controller');
// GET /api/admin/feedbacks?status=open&category=bug
router.get('/feedbacks', FeedbackController.adminList);
// PATCH /api/admin/feedbacks/:feedbackId — Cập nhật trạng thái + ghi chú
router.patch('/feedbacks/:feedbackId', [
  body('status').optional().isIn(['open','in_progress','resolved','closed']),
  body('adminNote').optional().trim(),
], validate, FeedbackController.adminUpdate);

// ─── Cài đặt hệ thống ────────────────────────────────────────────────────────
router.get('/settings', AdminController.getSettings);
router.patch('/settings', [
  body('platformCommissionRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Tỷ lệ phải từ 0 đến 1'),
], validate, AdminController.updateSettings);

module.exports = router;
