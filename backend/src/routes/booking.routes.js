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
  body('helperId').isInt().withMessage('helperId không hợp lệ'),
  body('serviceId').isInt().withMessage('serviceId không hợp lệ'),
  body('bookingDate').isDate().withMessage('Ngày đặt lịch không hợp lệ'),
  body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ bắt đầu không hợp lệ (HH:MM)'),
  body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('Giờ kết thúc không hợp lệ (HH:MM)'),
  body('address').trim().notEmpty().withMessage('Địa chỉ không được để trống'),
], validate, BookingController.createBooking);

// GET /api/bookings/my - Lịch sử đặt lịch của khách hàng
router.get('/my', authorize('customer'), BookingController.getMyBookingsAsCustomer);

// GET /api/bookings/helper/my - Lịch làm việc của helper
router.get('/helper/my', authorize('helper'), BookingController.getMyBookingsAsHelper);

// GET /api/bookings/:bookingId - Chi tiết booking
router.get('/:bookingId', BookingController.getBookingDetail);

// PATCH /api/bookings/:bookingId/confirm - Helper xác nhận đơn
router.patch('/:bookingId/confirm', authorize('helper'), BookingController.confirmBooking);

// PATCH /api/bookings/:bookingId/checkin - Helper check-in
router.patch('/:bookingId/checkin', authorize('helper'), BookingController.checkIn);

// PATCH /api/bookings/:bookingId/checkout - Helper check-out
router.patch('/:bookingId/checkout', authorize('helper'), BookingController.checkOut);

// PATCH /api/bookings/:bookingId/cancel - Hủy booking
router.patch('/:bookingId/cancel', authorize('customer', 'admin'), BookingController.cancelBooking);

module.exports = router;
