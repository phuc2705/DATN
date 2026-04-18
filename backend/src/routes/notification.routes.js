// Routes thông báo
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

// Tất cả notification routes yêu cầu đăng nhập
router.use(authenticate);

// GET /api/notifications?limit=20&offset=0
router.get('/', NotificationController.getNotifications);

// POST /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.post('/read-all', NotificationController.markAllAsRead);

// PATCH /api/notifications/:notificationId/read - Đánh dấu 1 thông báo đã đọc
router.patch('/:notificationId/read', NotificationController.markAsRead);

module.exports = router;
