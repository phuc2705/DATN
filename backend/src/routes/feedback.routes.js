// Routes phản hồi hệ thống — báo lỗi, khiếu nại, góp ý
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const FeedbackController = require('../controllers/feedback.controller');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.use(authenticate);

const VALID_CATEGORIES = ['bug', 'complaint_helper', 'complaint_customer', 'payment_issue', 'suggestion', 'other'];

// POST /api/feedback — Gửi phản hồi
router.post('/', [
  body('category').isIn(VALID_CATEGORIES).withMessage('Danh mục không hợp lệ'),
  body('subject').trim().notEmpty().withMessage('Tiêu đề không được để trống').isLength({ max: 200 }),
  body('description').trim().notEmpty().withMessage('Nội dung không được để trống'),
  body('bookingId').optional({ nullable: true }).isInt({ min: 1 }),
], validate, FeedbackController.create);

// GET /api/feedback/my — Xem lịch sử phản hồi của mình
router.get('/my', FeedbackController.getMy);

module.exports = router;
