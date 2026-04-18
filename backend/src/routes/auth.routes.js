// Routes xác thực - đăng ký, đăng nhập, refresh token
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Validation rules cho đăng ký khách hàng
const registerCustomerRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  body('address').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
  body('city').trim().notEmpty().withMessage('Thành phố không được để trống'),
];

// Validation rules cho đăng ký helper
const registerHelperRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  body('dateOfBirth').isDate().withMessage('Ngày sinh không hợp lệ'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),
  body('idCardNumber').trim().notEmpty().withMessage('Số CCCD không được để trống'),
  body('hourlyRate').isFloat({ min: 0 }).withMessage('Giá/giờ không hợp lệ'),
];

// POST /api/auth/register/customer
router.post('/register/customer', registerCustomerRules, validate, AuthController.registerCustomer);

// POST /api/auth/register/helper
router.post('/register/helper', registerHelperRules, validate, AuthController.registerHelper);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
], validate, AuthController.login);

// POST /api/auth/refresh - Làm mới Access Token
router.post('/refresh', AuthController.refreshToken);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần đăng nhập)
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
