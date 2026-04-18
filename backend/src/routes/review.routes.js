// Routes đánh giá helper
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const ReviewController = require('../controllers/review.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

// GET /api/reviews/helper/:helperId - Xem đánh giá của helper (public)
router.get('/helper/:helperId', ReviewController.getHelperReviews);

// Các route bên dưới yêu cầu đăng nhập
router.use(authenticate);

// POST /api/reviews - Customer tạo đánh giá sau booking hoàn thành
router.post('/', authorize('customer'), [
  body('bookingId').isInt().withMessage('bookingId không hợp lệ'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Điểm đánh giá từ 1 đến 5'),
  body('comment').optional().trim(),
], validate, ReviewController.createReview);

// GET /api/reviews/my - Customer xem đánh giá mình đã viết
router.get('/my', authorize('customer'), ReviewController.getMyReviews);

module.exports = router;
