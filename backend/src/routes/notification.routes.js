// Routes thông báo
const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

// Tất cả notification routes yêu cầu đăng nhập
router.use(authenticate);

// GET /api/notifications?page=1&limit=20&unread=true
router.get('/', NotificationController.getMyNotifications);

// GET /api/notifications/unread-count - Số thông báo chưa đọc
router.get('/unread-count', NotificationController.getUnreadCount);

// POST /api/notifications/read-all - Đánh dấu tất cả đã đọc
router.post('/read-all', NotificationController.markAllAsRead);

// PATCH /api/notifications/:notificationId/read - Đánh dấu 1 thông báo đã đọc
router.patch('/:notificationId/read', NotificationController.markAsRead);

module.exports = router;
