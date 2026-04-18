// Routes quản lý dịch vụ
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ServiceController = require('../controllers/service.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/services - Lấy tất cả dịch vụ (public)
router.get('/', ServiceController.getAllServices);

// GET /api/services/:serviceId/helpers?city=HCM - Tìm helper theo dịch vụ
router.get('/:serviceId/helpers', ServiceController.searchHelpers);

// GET /api/services/helpers/:helperId/schedule - Lịch làm việc helper
router.get('/helpers/:helperId/schedule', ServiceController.getHelperSchedule);

// POST /api/services - Admin tạo dịch vụ mới
router.post('/', authenticate, authorize('admin'), [
  body('serviceName').trim().notEmpty().withMessage('Tên dịch vụ không được để trống'),
  body('basePrice').isFloat({ min: 0 }).withMessage('Giá cơ bản không hợp lệ'),
], validate, ServiceController.createService);

// POST /api/services/helpers/:helperId/register - Helper đăng ký dịch vụ
router.post('/helpers/:helperId/register', authenticate, authorize('helper'), [
  body('serviceId').isInt().withMessage('serviceId không hợp lệ'),
  body('experienceLevel').isIn(['beginner', 'intermediate', 'expert']).withMessage('Cấp độ không hợp lệ'),
], validate, ServiceController.registerHelperService);

module.exports = router;
