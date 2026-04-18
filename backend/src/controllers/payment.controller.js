// Controller thanh toán - xác nhận thanh toán và lịch sử giao dịch
const PaymentModel = require('../models/payment.model');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const PaymentController = {
  // Xác nhận thanh toán cho booking (customer hoặc admin)
  confirmPayment: async (req, res, next) => {
    try {
      const { user_id, user_type } = req.user;
      const { bookingId } = req.params;

      // Lấy thông tin payment hiện tại
      const payment = await PaymentModel.findByBooking(bookingId);
      if (!payment) return sendError(res, 'Không tìm thấy thông tin thanh toán.', 404);
      if (payment.payment_status === 'paid') return sendError(res, 'Booking này đã được thanh toán.', 409);

      // Customer chỉ được thanh toán booking của mình
      if (user_type === 'customer') {
        const customerProfile = await UserModel.getCustomerProfile(user_id);
        const [bookingRows] = await pool.query(
          'SELECT customer_id FROM bookings WHERE booking_id = ?',
          [bookingId]
        );
        if (!bookingRows[0] || bookingRows[0].customer_id !== customerProfile.customer_id) {
          return sendError(res, 'Bạn không có quyền thanh toán booking này.', 403);
        }
      }

      await PaymentModel.confirmPayment(bookingId, user_id);

      // Lấy thông tin helper để gửi thông báo
      const [bookingInfo] = await pool.query(
        `SELECT h.user_id AS helper_user_id, b.total_price
         FROM bookings b JOIN helpers h ON b.helper_id = h.helper_id
         WHERE b.booking_id = ?`,
        [bookingId]
      );

      if (bookingInfo[0]) {
        await NotificationModel.create({
          userId: bookingInfo[0].helper_user_id,
          title: 'Thanh toán đã được xác nhận',
          body: `Khách hàng đã thanh toán ${Number(bookingInfo[0].total_price).toLocaleString('vi-VN')}đ cho buổi làm việc.`,
          type: 'payment',
          refId: parseInt(bookingId),
        });
      }

      return sendSuccess(res, null, 'Xác nhận thanh toán thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Lịch sử thanh toán của customer đang đăng nhập
  getMyPayments: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      const payments = await PaymentModel.findByCustomer(customerProfile.customer_id);

      // Tính tổng chi tiêu
      const totalSpent = payments
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return sendSuccess(res, { payments, totalSpent });
    } catch (error) {
      next(error);
    }
  },

  // Thu nhập của helper đang đăng nhập
  getHelperEarnings: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [helperRows] = await pool.query(
        'SELECT helper_id FROM helpers WHERE user_id = ?',
        [user_id]
      );
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      const payments = await PaymentModel.findByHelper(helperRows[0].helper_id);

      const totalEarned = payments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return sendSuccess(res, { payments, totalEarned });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = PaymentController;
