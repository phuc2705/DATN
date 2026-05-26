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
        type: 'new_review',
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

      const mappedReviews = reviews.map((r) => ({
        reviewId:       r.review_id,
        rating:         r.rating,
        comment:        r.comment,
        createdAt:      r.created_at,
        customerName:   r.customer_name,
        customerAvatar: r.customer_avatar,
        bookingId:      r.booking_id,
      }));

      return sendSuccess(res, { reviews: mappedReviews, total, distribution, limit, offset });
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

  // Helper đánh giá lại khách hàng sau khi hoàn thành dịch vụ
  helperReviewCustomer: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { bookingId, rating, comment } = req.body;

      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);
      const helperId = helperRows[0].helper_id;

      const [[booking]] = await pool.query(
        `SELECT b.booking_id, b.customer_id, b.status, b.is_helper_reviewed
         FROM bookings b
         WHERE b.booking_id = ? AND b.helper_id = ?`,
        [bookingId, helperId]
      );
      if (!booking)                     return sendError(res, 'Không tìm thấy booking.', 404);
      if (booking.status !== 'completed') return sendError(res, 'Chỉ có thể đánh giá booking đã hoàn thành.', 400);
      if (booking.is_helper_reviewed)   return sendError(res, 'Bạn đã đánh giá khách hàng này rồi.', 409);

      const [result] = await pool.query(
        `INSERT INTO helper_reviews (booking_id, helper_id, customer_id, rating, comment)
         VALUES (?, ?, ?, ?, ?)`,
        [bookingId, helperId, booking.customer_id, rating, comment || null]
      );
      await pool.query('UPDATE bookings SET is_helper_reviewed = 1 WHERE booking_id = ?', [bookingId]);

      return sendSuccess(res, { reviewId: result.insertId }, 'Đánh giá thành công! Cảm ơn bạn.', 201);
    } catch (error) {
      next(error);
    }
  },

  // Lấy đánh giá nổi bật để hiển thị trên trang chủ (public)
  getRecentReviews: async (req, res, next) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 6, 12);
      const [reviews] = await pool.query(
        `SELECT r.review_id, r.rating, r.comment, r.created_at,
                u.full_name AS customer_name, u.avatar_url AS customer_avatar,
                c.city, c.district,
                s.service_name
         FROM reviews r
         JOIN customers c  ON r.customer_id = c.customer_id
         JOIN users u      ON c.user_id = u.user_id
         JOIN bookings b   ON r.booking_id = b.booking_id
         JOIN services s   ON b.service_id = s.service_id
         WHERE r.is_visible = 1
           AND r.comment IS NOT NULL AND r.comment != ''
         ORDER BY r.rating DESC, r.created_at DESC
         LIMIT ?`,
        [limit]
      );
      return sendSuccess(res, reviews.map(r => ({
        reviewId:       r.review_id,
        rating:         r.rating,
        comment:        r.comment,
        createdAt:      r.created_at,
        customerName:   r.customer_name,
        customerAvatar: r.customer_avatar,
        location:       [r.district, r.city].filter(Boolean).join(', ') || 'Hà Nội',
        serviceName:    r.service_name,
      })));
    } catch (error) {
      next(error);
    }
  },

  // Helper xem các đánh giá mình đã nhận từ khách hàng
  getMyHelperReviews: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [helperRows] = await pool.query('SELECT helper_id FROM helpers WHERE user_id = ?', [user_id]);
      if (!helperRows[0]) return sendError(res, 'Không tìm thấy thông tin helper.', 404);

      const [reviews] = await pool.query(
        `SELECT r.review_id, r.rating, r.comment, r.created_at,
                u.full_name AS customer_name, u.avatar_url AS customer_avatar,
                r.booking_id
         FROM reviews r
         JOIN customers c ON r.customer_id = c.customer_id
         JOIN users u ON c.user_id = u.user_id
         WHERE r.helper_id = ? AND r.is_visible = 1
         ORDER BY r.created_at DESC`,
        [helperRows[0].helper_id]
      );
      return sendSuccess(res, reviews.map(r => ({
        reviewId:       r.review_id,
        rating:         r.rating,
        comment:        r.comment,
        customerName:   r.customer_name,
        customerAvatar: r.customer_avatar,
        bookingId:      r.booking_id,
        createdAt:      r.created_at,
      })));
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ReviewController;
