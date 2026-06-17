// Routes xác thực - đăng ký (kèm OTP), đăng nhập, refresh token
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

// Rate limiter cho OTP: tối đa 3 requests/5 phút per IP
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
});

// Rate limiter cho login: tối đa 10 requests/15 phút per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
});

// Validation rules cho đăng ký khách hàng
const registerCustomerRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  body('address').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
  body('city').trim().notEmpty().withMessage('Thành phố không được để trống'),
];

// Validation rules cho đăng ký helper
const registerHelperRules = [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu tối thiểu 6 ký tự'),
  body('fullName').trim().notEmpty().withMessage('Họ tên không được để trống'),
  body('phone').matches(/^[0-9]{10,11}$/).withMessage('Số điện thoại không hợp lệ'),
  body('dateOfBirth').isDate().withMessage('Ngày sinh không hợp lệ'),
  body('gender').isIn(['male', 'female', 'other']).withMessage('Giới tính không hợp lệ'),
  body('idCardNumber').trim().notEmpty().withMessage('Số CCCD không được để trống'),
];

// POST /api/auth/register/customer - Bước 1: gửi OTP
router.post('/register/customer', otpLimiter, registerCustomerRules, validate, AuthController.registerCustomer);

// POST /api/auth/register/helper - Bước 1: gửi OTP (upload.fields xử lý avatar + ảnh CCCD 2 mặt)
router.post('/register/helper', otpLimiter, upload.fields([
  { name: 'avatar',      maxCount: 1 },
  { name: 'idCardFront', maxCount: 1 },
  { name: 'idCardBack',  maxCount: 1 },
]), registerHelperRules, validate, AuthController.registerHelper);

// POST /api/auth/verify-otp - Bước 2: xác minh OTP và tạo tài khoản
router.post('/verify-otp', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số').isNumeric().withMessage('Mã OTP phải là số'),
], validate, AuthController.verifyOtp);

// POST /api/auth/resend-otp - Gửi lại OTP
router.post('/resend-otp', otpLimiter, [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
], validate, AuthController.resendOtp);

// POST /api/auth/forgot-password - Gửi OTP đặt lại mật khẩu
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
], validate, AuthController.forgotPassword);

// POST /api/auth/reset-password - Xác minh OTP và đặt mật khẩu mới
router.post('/reset-password', [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Mã OTP phải có 6 chữ số').isNumeric().withMessage('Mã OTP phải là số'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới tối thiểu 6 ký tự'),
], validate, AuthController.resetPassword);

// POST /api/auth/login
router.post('/login', loginLimiter, [
  body('email').isEmail().withMessage('Email không hợp lệ').normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
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
