// Controller thông báo - lấy, đánh dấu đã đọc, đếm chưa đọc
const NotificationModel = require('../models/notification.model');
const { sendSuccess, sendError } = require('../utils/response');

const NotificationController = {
  // GET /api/notifications - Lấy danh sách thông báo (phân trang, filter unread)
  getMyNotifications: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, parseInt(req.query.limit) || 20);
      const offset = (page - 1) * limit;
      const onlyUnread = req.query.unread === 'true';

      const [notifications, unreadCount] = await Promise.all([
        NotificationModel.findByUser(user_id, limit, offset, onlyUnread),
        NotificationModel.countUnread(user_id),
      ]);

      return sendSuccess(res, { notifications, unreadCount, page, limit });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/notifications (alias giữ tương thích cũ)
  getNotifications: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const limit = parseInt(req.query.limit) || 20;
      const offset = parseInt(req.query.offset) || 0;

      const [notifications, unreadCount] = await Promise.all([
        NotificationModel.findByUser(user_id, limit, offset),
        NotificationModel.countUnread(user_id),
      ]);

      return sendSuccess(res, { notifications, unreadCount, limit, offset });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/notifications/:notificationId/read - Đánh dấu 1 thông báo đã đọc
  markAsRead: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { notificationId } = req.params;

      const updated = await NotificationModel.markAsRead(notificationId, user_id);
      if (!updated) return sendError(res, 'Không tìm thấy thông báo.', 404);

      return sendSuccess(res, null, 'Đã đánh dấu đã đọc.');
    } catch (error) {
      next(error);
    }
  },

  // POST /api/notifications/read-all - Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      await NotificationModel.markAllAsRead(user_id);
      return sendSuccess(res, null, 'Đã đánh dấu tất cả là đã đọc.');
    } catch (error) {
      next(error);
    }
  },

  // GET /api/notifications/unread-count - Trả về số thông báo chưa đọc
  getUnreadCount: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const count = await NotificationModel.countUnread(user_id);
      return sendSuccess(res, { unreadCount: count });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = NotificationController;
