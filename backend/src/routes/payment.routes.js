// Routes thanh toán
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');

// Tất cả routes payment đều yêu cầu đăng nhập
router.use(authenticate);

// POST /api/payments/:bookingId/confirm - Xác nhận thanh toán
router.post('/:bookingId/confirm', authorize('customer', 'admin'), PaymentController.confirmPayment);

// GET /api/payments/my - Lịch sử thanh toán của customer
router.get('/my', authorize('customer'), PaymentController.getMyPayments);

// GET /api/payments/helper/earnings - Thu nhập của helper
router.get('/helper/earnings', authorize('helper'), PaymentController.getHelperEarnings);

module.exports = router;
