// Tạo thông báo vào DB và đẩy real-time qua Socket.io
const NotificationModel = require('../models/notification.model');
const { emitToUser } = require('../socket');

const pushNotification = async ({ userId, title, body, type, refId = null }) => {
  try {
    const notificationId = await NotificationModel.create({ userId, title, body, type, refId });
    emitToUser(userId, 'notification', { notificationId, title, body, type, refId });
  } catch {
    // Thông báo thất bại không được làm gián đoạn luồng chính
  }
};

module.exports = { pushNotification };
