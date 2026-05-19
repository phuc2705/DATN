// Routes xác thực - đăng ký (kèm OTP), đăng nhập, refresh token
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

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
];

// POST /api/auth/register/customer - Bước 1: gửi OTP
router.post('/register/customer', registerCustomerRules, validate, AuthController.registerCustomer);

// POST /api/auth/register/helper - Bước 1: gửi OTP (upload.single xử lý multipart trước validation)
router.post('/register/helper', upload.single('avatar'), registerHelperRules, validate, AuthController.registerHelper);

// POST /api/auth/verify-otp - Bước 2: xác minh OTP và tạo tài khoản
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số').isNumeric().withMessage('Mã OTP phải là số'),
], validate, AuthController.verifyOtp);

// POST /api/auth/resend-otp - Gửi lại OTP
router.post('/resend-otp', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail(),
], validate, AuthController.resendOtp);

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Email không hợp lệ'),
  body('password').notEmpty().withMessage('Mật khẩu không được để trống'),
], validate, AuthController.login);

// POST /api/auth/firebase - Đăng nhập / đăng ký bằng Google hoặc Facebook (Firebase OAuth)
router.post('/firebase', [
  body('idToken').notEmpty().withMessage('ID token không được để trống'),
], validate, AuthController.firebaseLogin);

// POST /api/auth/refresh - Làm mới Access Token
router.post('/refresh', AuthController.refreshToken);

// GET /api/auth/me - Lấy thông tin user hiện tại (cần đăng nhập)
router.get('/me', authenticate, AuthController.getMe);

module.exports = router;
