// Controller thông báo - lấy, đánh dấu đã đọc
const NotificationModel = require('../models/notification.model');
const { sendSuccess, sendError } = require('../utils/response');

const NotificationController = {
  // Lấy danh sách thông báo (phân trang)
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

  // Đánh dấu 1 thông báo đã đọc
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

  // Đánh dấu tất cả thông báo đã đọc
  markAllAsRead: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      await NotificationModel.markAllAsRead(user_id);
      return sendSuccess(res, null, 'Đã đánh dấu tất cả là đã đọc.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = NotificationController;
