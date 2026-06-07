// Routes đặt lịch và quản lý trạng thái booking
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const BookingController = require('../controllers/booking.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// Tất cả routes booking đều yêu cầu đăng nhập
router.use(authenticate);

// POST /api/bookings - Khách hàng tạo đơn đặt lịch
router.post('/', authorize('customer'), [
  body('helperId').optional().isInt({ min: 1 }).withMessage('helperId không hợp lệ'),
  body('serviceId').isInt().withMessage('serviceId không hợp lệ'),
  body('bookingDate').isDate().withMessage('Ngày đặt lịch không hợp lệ'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ bắt đầu không hợp lệ (HH:MM)'),
  body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ kết thúc không hợp lệ (HH:MM)'),
  body('address').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
], validate, BookingController.createBooking);

// GET /api/bookings/promo/validate - Xác minh mã khuyến mãi (phải đặt trước /:bookingId)
router.get('/promo/validate', authorize('customer'), BookingController.validatePromoCode);

// GET /api/bookings/price-preview - Tính giá ước tính từ backend (có xét experience + custom_price)
router.get('/price-preview', BookingController.pricePreview);

// GET /api/bookings/suggest-helpers - Gợi ý helper xếp hạng theo thuật toán matching
router.get('/suggest-helpers', BookingController.suggestHelpers);

// GET /api/bookings/check-availability - Kiểm tra helper rảnh + gợi ý khung giờ thay thế
router.get('/check-availability', BookingController.checkAvailability);

// GET /api/bookings/my - Lịch sử đặt lịch của khách hàng
router.get('/my', authorize('customer'), BookingController.getMyBookingsAsCustomer);

// GET /api/bookings/my-trust-info - Thông tin uy tín (tỷ lệ hoàn thành, phương thức thanh toán được phép)
router.get('/my-trust-info', authorize('customer'), BookingController.getMyTrustInfo);

// GET /api/bookings/my-previous-helpers - Danh sách helper quen để customer yêu cầu lại
router.get('/my-previous-helpers', authorize('customer'), BookingController.getPreviousHelpers);

// GET /api/bookings/helper/my - Lịch làm việc của helper (đã nhận)
router.get('/helper/my', authorize('helper'), BookingController.getMyBookingsAsHelper);

// GET /api/bookings/helper/available-jobs - Job board: helper xem việc có thể nhận
router.get('/helper/available-jobs', authorize('helper'), BookingController.getAvailableJobs);

// GET /api/bookings/:bookingId/suggestions - Gợi ý khung giờ thay thế khi đơn bị hủy
router.get('/:bookingId/suggestions', BookingController.getBookingSuggestions);

// GET /api/bookings/:bookingId - Chi tiết booking
router.get('/:bookingId', BookingController.getBookingDetail);

// PATCH /api/bookings/:bookingId/confirm - Helper xác nhận đơn
router.patch('/:bookingId/confirm', authorize('helper'), BookingController.confirmBooking);

// PATCH /api/bookings/:bookingId/checkin - Helper check-in
router.patch('/:bookingId/checkin', authorize('helper'), BookingController.checkIn);

// PATCH /api/bookings/:bookingId/checkout - Helper check-out
router.patch('/:bookingId/checkout', authorize('helper'), BookingController.checkOut);

// PATCH /api/bookings/:bookingId/accept - Helper nhận việc từ job board
router.patch('/:bookingId/accept', authorize('helper'), BookingController.acceptJob);

// PATCH /api/bookings/:bookingId/cancel - Hủy booking
router.patch('/:bookingId/cancel', authorize('customer', 'admin'), BookingController.cancelBooking);

module.exports = router;
