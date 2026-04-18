// Controller đánh giá - customer đánh giá helper sau khi hoàn thành dịch vụ
const ReviewModel = require('../models/review.model');
const UserModel = require('../models/user.model');
const NotificationModel = require('../models/notification.model');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const ReviewController = {
  // Customer tạo đánh giá cho booking đã hoàn thành
  createReview: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { bookingId, rating, comment } = req.body;

      // Lấy thông tin customer
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      // Kiểm tra booking tồn tại, đã hoàn thành và thuộc về customer này
      const [bookingRows] = await pool.query(
        `SELECT b.booking_id, b.helper_id, b.status, b.is_reviewed, h.user_id AS helper_user_id
         FROM bookings b
         JOIN helpers h ON b.helper_id = h.helper_id
         WHERE b.booking_id = ? AND b.customer_id = ?`,
        [bookingId, customerProfile.customer_id]
      );

      const booking = bookingRows[0];
      if (!booking) return sendError(res, 'Không tìm thấy booking.', 404);
      if (booking.status !== 'completed') return sendError(res, 'Chỉ có thể đánh giá booking đã hoàn thành.', 400);
      if (booking.is_reviewed) return sendError(res, 'Booking này đã được đánh giá.', 409);

      // Kiểm tra booking chưa có review
      const existing = await ReviewModel.findByBooking(bookingId);
      if (existing) return sendError(res, 'Booking này đã được đánh giá.', 409);

      const reviewId = await ReviewModel.create({
        bookingId,
        customerId: customerProfile.customer_id,
        helperId: booking.helper_id,
        rating,
        comment,
      });

      // Gửi thông báo đến helper
      await NotificationModel.create({
        userId: booking.helper_user_id,
        title: 'Bạn nhận được đánh giá mới',
        body: `Khách hàng đã đánh giá ${rating} sao cho buổi làm việc vừa rồi.`,
        type: 'review',
        refId: reviewId,
      });

      return sendSuccess(res, { reviewId }, 'Đánh giá thành công! Cảm ơn bạn.', 201);
    } catch (error) {
      next(error);
    }
  },

  // Lấy danh sách đánh giá của một helper (public)
  getHelperReviews: async (req, res, next) => {
    try {
      const { helperId } = req.params;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const [reviews, total] = await Promise.all([
        ReviewModel.findByHelper(helperId, limit, offset),
        ReviewModel.countByHelper(helperId),
      ]);

      // Tính phân phối điểm (1-5 sao)
      const [distribution] = await pool.query(
        `SELECT rating, COUNT(*) AS count FROM reviews WHERE helper_id = ? GROUP BY rating ORDER BY rating DESC`,
        [helperId]
      );

      return sendSuccess(res, { reviews, total, distribution, limit, offset });
    } catch (error) {
      next(error);
    }
  },

  // Customer xem danh sách đánh giá mình đã viết
  getMyReviews: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const customerProfile = await UserModel.getCustomerProfile(user_id);
      if (!customerProfile) return sendError(res, 'Không tìm thấy thông tin khách hàng.', 404);

      const reviews = await ReviewModel.findByCustomer(customerProfile.customer_id);
      return sendSuccess(res, reviews);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ReviewController;
