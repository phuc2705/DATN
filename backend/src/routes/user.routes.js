// Routes quản lý thông tin cá nhân user
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const UserController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/users/helpers/:helperId - Xem profile công khai của helper (không cần đăng nhập)
router.get('/helpers/:helperId', UserController.getHelperPublicProfile);

// Các route bên dưới đều yêu cầu đăng nhập
router.use(authenticate);

// PUT /api/users/profile - Cập nhật thông tin cá nhân
router.put('/profile', [
  body('fullName').optional().trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').optional().matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  body('hourlyRate').optional().isFloat({ min: 0 }).withMessage('Giá/giờ không hợp lệ'),
], validate, UserController.updateProfile);

// PUT /api/users/change-password - Đổi mật khẩu
router.put('/change-password', [
  body('currentPassword').notEmpty().withMessage('Mật khẩu hiện tại không được để trống'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
], validate, UserController.changePassword);

// PATCH /api/users/helper/availability - Bật/tắt nhận việc (helper only)
router.patch('/helper/availability', authorize('helper'), UserController.toggleAvailability);

// PUT /api/users/helper/schedule - Cập nhật lịch làm việc (helper only)
router.put('/helper/schedule', authorize('helper'), [
  body('schedules').isArray().withMessage('schedules phải là mảng'),
  body('schedules.*.dayOfWeek').isIn(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']).withMessage('Ngày không hợp lệ'),
  body('schedules.*.startTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ bắt đầu không hợp lệ'),
  body('schedules.*.endTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ kết thúc không hợp lệ'),
], validate, UserController.updateSchedule);

module.exports = router;
