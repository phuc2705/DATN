// Routes thanh toán - tiền mặt, chuyển khoản và VNPay
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/payments/vnpay-return — VNPay redirect về sau thanh toán (public, không cần JWT)
router.get('/vnpay-return', PaymentController.vnpayReturn);

// Tất cả routes bên dưới yêu cầu đăng nhập
router.use(authenticate);

// POST /api/payments/:bookingId/confirm — Xác nhận thanh toán tiền mặt
router.post('/:bookingId/confirm', authorize('customer', 'admin'), PaymentController.confirmPayment);

// POST /api/payments/:bookingId/vnpay-url — Tạo URL thanh toán VNPay (full amount, khách uy tín)
router.post('/:bookingId/vnpay-url', authorize('customer'), PaymentController.createVNPayPaymentUrl);

// POST /api/payments/:bookingId/vnpay-deposit — Tạo URL VNPay đặt cọc 70% (khách mới/uy tín thấp)
router.post('/:bookingId/vnpay-deposit', authorize('customer'), PaymentController.createVNPayDepositUrl);

// POST /api/payments/:bookingId/vnpay-remaining — Tạo URL VNPay thanh toán 30% còn lại
router.post('/:bookingId/vnpay-remaining', authorize('customer'), PaymentController.createVNPayRemainingUrl);

// POST /api/payments/:bookingId/confirm-remaining — Xác nhận 30% còn lại bằng tiền mặt
router.post('/:bookingId/confirm-remaining', authorize('customer', 'admin'), PaymentController.confirmRemainingPayment);

// GET /api/payments/:bookingId/bank-transfer — Lấy thông tin chuyển khoản ngân hàng
router.get('/:bookingId/bank-transfer', authorize('customer'), PaymentController.getBankTransferInfo);

// GET /api/payments/my — Lịch sử thanh toán của customer
router.get('/my', authorize('customer'), PaymentController.getMyPayments);

// GET /api/payments/helper/earnings — Thu nhập của helper
router.get('/helper/earnings', authorize('helper'), PaymentController.getHelperEarnings);

module.exports = router;
