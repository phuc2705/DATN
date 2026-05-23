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

// Chỉ gửi email khi user đang offline — nếu đang online thì web notification đã đủ
const mailIfOffline = (userId, emailFn) => {
  if (!isUserOnline(userId)) {
    emailFn().catch(() => {});
  }
};

module.exports = { pushNotification, mailIfOffline };
