// Controller thanh toán - tiền mặt, chuyển khoản ngân hàng và VNPay
const PaymentModel = require('../models/payment.model');
const UserModel = require('../models/user.model');
const { createVNPayUrl, verifyVNPayReturn } = require('../utils/vnpay');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');
const { pushNotification } = require('../utils/notify');

const sendPaymentNotification = (bookingId) => {
  pool.query(
    `SELECT h.user_id AS helper_user_id, b.total_price
     FROM bookings b JOIN helpers h ON b.helper_id = h.helper_id
     WHERE b.booking_id = ?`,
    [bookingId]
  ).then(([rows]) => {
    if (rows[0]) {
      pushNotification({
        userId: rows[0].helper_user_id,
        title: 'Thanh toán đã được xác nhận',
        body: `Khách hàng đã thanh toán ${Number(rows[0].total_price).toLocaleString('vi-VN')}đ cho buổi làm việc.`,
        type: 'payment_received',
        refId: parseInt(bookingId),
      });
    }
  }).catch(() => {});
};

const PaymentController = {
  // Xác nhận thanh toán tiền mặt (customer hoặc admin)
  confirmPayment: async (req, res, next) => {
    try {
      const { user_id, user_type } = req.user;
      const { bookingId } = req.params;

      const payment = await PaymentModel.findByBooking(bookingId);
      if (!payment) return sendError(res, 'Không tìm thấy thông tin thanh toán.', 404);
      if (payment.payment_status === 'paid') return sendError(res, 'Booking này đã được thanh toán.', 409);

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
      sendPaymentNotification(bookingId);

      return sendSuccess(res, null, 'Xác nhận thanh toán thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Tạo URL thanh toán VNPay cho booking
  createVNPayPaymentUrl: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      // Kiểm tra booking thuộc customer này
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      const [[booking]] = await pool.query(
        'SELECT b.customer_id, b.total_price FROM bookings b WHERE b.booking_id = ?',
        [bookingId]
      );
      if (!booking) return sendError(res, 'Không tìm thấy đơn hàng.', 404);
      if (booking.customer_id !== customerProfile.customer_id) {
        return sendError(res, 'Bạn không có quyền thanh toán đơn này.', 403);
      }

      const payment = await PaymentModel.findByBooking(bookingId);
      if (!payment) return sendError(res, 'Không tìm thấy thông tin thanh toán.', 404);
      if (payment.payment_status === 'paid') return sendError(res, 'Đơn hàng đã được thanh toán.', 409);

      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
      const paymentUrl = createVNPayUrl(
        bookingId,
        parseFloat(payment.amount),
        `Thanh toan don hang ${bookingId}`,
        ip
      );

      return sendSuccess(res, { paymentUrl });
    } catch (error) {
      next(error);
    }
  },

  // Xử lý redirect từ VNPay sau khi thanh toán (không cần JWT)
  vnpayReturn: async (req, res, next) => {
    try {
      const query = req.query;
      const isValid = verifyVNPayReturn(query);
      const isSuccess = isValid && query.vnp_ResponseCode === '00';
      const bookingId = query.vnp_TxnRef?.split('_')[0];

      if (isSuccess && bookingId) {
        const payment = await PaymentModel.findByBooking(bookingId);
        // Chỉ confirm nếu chưa thanh toán (tránh double-confirm)
        if (payment && payment.payment_status !== 'paid') {
          await PaymentModel.confirmPayment(bookingId, null);
          await pool.query(
            'UPDATE payments SET payment_method = ? WHERE booking_id = ?',
            ['vnpay', bookingId]
          );
          sendPaymentNotification(bookingId);
        }
      }

      const status = isSuccess ? 'success' : 'failed';
      const redirectUrl = `${process.env.CLIENT_URL}/payment/vnpay-return?status=${status}&bookingId=${bookingId || ''}`;
      return res.redirect(redirectUrl);
    } catch (error) {
      const redirectUrl = `${process.env.CLIENT_URL}/payment/vnpay-return?status=failed`;
      return res.redirect(redirectUrl);
    }
  },

  // Lịch sử thanh toán của customer đang đăng nhập
  getMyPayments: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      const payments = await PaymentModel.findByCustomer(customerProfile.customer_id);
      const totalSpent = payments
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return sendSuccess(res, { payments, totalSpent });
    } catch (error) {
      next(error);
    }
  },

  // Lấy thông tin chuyển khoản ngân hàng cho booking
  getBankTransferInfo: async (req, res, next) => {
    try {
      const { bookingId } = req.params;
      const { user_id } = req.user;

      const customerProfile = await UserModel.getCustomerProfile(user_id);
      const [[booking]] = await pool.query(
        'SELECT b.customer_id, b.total_price FROM bookings b WHERE b.booking_id = ?',
        [bookingId]
      );
      if (!booking) return sendError(res, 'Không tìm thấy đơn hàng.', 404);
      if (booking.customer_id !== customerProfile.customer_id) {
        return sendError(res, 'Bạn không có quyền xem thông tin này.', 403);
      }

      const amount = parseFloat(booking.total_price);
      const transferContent = `DH${bookingId}`;
      const bankId = process.env.BANK_ID || 'MB';
      const accountNo = process.env.BANK_ACCOUNT || '1234567890';
      const accountName = process.env.BANK_HOLDER || 'NGUYEN VAN A';
      const bankName = process.env.BANK_NAME || 'MB Bank';

      const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountName)}`;

      return sendSuccess(res, {
        bankId,
        accountNo,
        accountName,
        bankName,
        amount,
        transferContent,
        qrUrl,
      });
    } catch (error) {
      next(error);
    }
  },

  // Thu nhập của helper đang đăng nhập
  getHelperEarnings: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [[helperRow]] = await pool.query(
        'SELECT helper_id, rating_average, total_bookings FROM helpers WHERE user_id = ?',
        [user_id]
      );
      if (!helperRow) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      const rows = await PaymentModel.findByHelper(helperRow.helper_id);

      // Tính thu nhập helper (90% doanh thu)
      const PLATFORM_FEE = 0.1;
      const payments = rows.map((p) => ({
        paymentId:     p.payment_id,
        bookingId:     p.booking_id,
        amount:        Number(p.amount),
        helperEarning: Math.round(Number(p.amount) * (1 - PLATFORM_FEE)),
        paymentMethod: p.payment_method,
        paymentStatus: p.payment_status,
        paidAt:        p.paid_at,
        bookingDate:   p.booking_date,
        serviceName:   p.service_name,
        customerName:  p.customer_name,
      }));

      const totalEarnings = payments.reduce((s, p) => s + p.helperEarning, 0);

      const now = new Date();

      // Thu nhập tháng hiện tại
      const monthlyEarnings = payments
        .filter((p) => p.paidAt && new Date(p.paidAt).getMonth() === now.getMonth() && new Date(p.paidAt).getFullYear() === now.getFullYear())
        .reduce((s, p) => s + p.helperEarning, 0);

      // Thu nhập tuần hiện tại (từ thứ Hai)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
      startOfWeek.setHours(0, 0, 0, 0);
      const weeklyEarnings = payments
        .filter((p) => p.paidAt && new Date(p.paidAt) >= startOfWeek)
        .reduce((s, p) => s + p.helperEarning, 0);

      // Thống kê thu nhập theo từng dịch vụ
      const byServiceMap = {};
      payments.forEach((p) => {
        const key = p.serviceName || 'Khác';
        if (!byServiceMap[key]) byServiceMap[key] = { serviceName: key, count: 0, earning: 0 };
        byServiceMap[key].count++;
        byServiceMap[key].earning += p.helperEarning;
      });
      const byService = Object.values(byServiceMap).sort((a, b) => b.earning - a.earning);

      // Thu nhập trung bình mỗi đơn
      const avgPerOrder = payments.length > 0 ? Math.round(totalEarnings / payments.length) : 0;

      return sendSuccess(res, {
        summary: {
          totalEarnings,
          monthlyEarnings,
          weeklyEarnings,
          avgPerOrder,
          completedBookings: payments.length,
          ratingAverage: Number(helperRow.rating_average) || 0,
        },
        byService,
        payments,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = PaymentController;
