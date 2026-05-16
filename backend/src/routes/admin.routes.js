// Routes quản trị - chỉ admin mới được truy cập
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Tất cả admin routes yêu cầu đăng nhập + quyền admin
router.use(authenticate, authorize('admin'));

// GET /api/admin/stats - Tổng quan dashboard
router.get('/stats', AdminController.getDashboardStats);

// ─── Quản lý User ──────────────────────────────────────────────────────────────
// GET /api/admin/users?userType=helper&isActive=true&search=...
router.get('/users', AdminController.listUsers);

// PATCH /api/admin/users/:userId/status - Kích hoạt / khóa tài khoản
router.patch('/users/:userId/status', [
  body('isActive').isBoolean().withMessage('isActive phải là boolean'),
], validate, AdminController.setUserStatus);

// PATCH /api/admin/helpers/:helperId/verify - Xác minh helper
router.patch('/helpers/:helperId/verify', AdminController.verifyHelper);

// ─── Quản lý Booking ──────────────────────────────────────────────────────────
router.get('/bookings', AdminController.listAllBookings);
router.patch('/bookings/:bookingId/status', AdminController.updateBookingStatus);
// PATCH /api/admin/bookings/:bookingId/assign - Giao việc cho helper
router.patch('/bookings/:bookingId/assign', [
  body('helperId').isInt({ min: 1 }).withMessage('helperId không hợp lệ'),
], validate, AdminController.assignHelper);

// GET /api/admin/helpers/available?bookingId=X - Helpers đang hoạt động, lọc theo vị trí 5km
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

// ─── Quản lý Payment ──────────────────────────────────────────────────────────
// GET /api/admin/payments?status=paid&startDate=...
router.get('/payments', AdminController.listAllPayments);

// ─── Quản lý Dịch vụ ──────────────────────────────────────────────────────────
router.get('/services', AdminController.listServices);
// PUT /api/admin/services/:serviceId
router.put('/services/:serviceId', [
  body('serviceName').optional().trim().notEmpty(),
  body('basePrice').optional().isFloat({ min: 0 }),
], validate, AdminController.updateService);

// DELETE /api/admin/services/:serviceId (soft delete)
router.delete('/services/:serviceId', AdminController.deleteService);

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

module.exports = router;
