// Tạo thông báo vào DB và đẩy real-time qua Socket.io
const NotificationModel = require('../models/notification.model');
const { emitToUser, isUserOnline } = require('../socket');

const pushNotification = async ({ userId, title, body, type, refId = null }) => {
  try {
    const notificationId = await NotificationModel.create({ userId, title, body, type, refId });
    emitToUser(userId, 'notification', { notificationId, title, body, type, refId, created_at: new Date().toISOString() });
  } catch {
    // Thông báo thất bại không được làm gián đoạn luồng chính
  }
};

// Gửi email khi user offline; trong môi trường dev luôn gửi để tiện kiểm thử
const mailIfOffline = (userId, emailFn) => {
  if (process.env.NODE_ENV !== 'production' || !isUserOnline(userId)) {
    emailFn().catch(() => {});
  }
};

module.exports = { pushNotification, mailIfOffline };
