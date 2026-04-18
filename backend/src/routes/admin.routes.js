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
// GET /api/admin/bookings?status=pending&startDate=2025-01-01&endDate=2025-01-31
router.get('/bookings', AdminController.listAllBookings);

// ─── Quản lý Payment ──────────────────────────────────────────────────────────
// GET /api/admin/payments?status=paid&startDate=...
router.get('/payments', AdminController.listAllPayments);

// ─── Quản lý Dịch vụ ──────────────────────────────────────────────────────────
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
