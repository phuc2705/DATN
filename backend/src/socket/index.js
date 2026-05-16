// Socket.io manager — xác thực JWT, quản lý phòng user, phát sự kiện real-time
const { verifyAccessToken } = require('../config/jwt');

// Map user_id → Set<socket.id> để hỗ trợ multi-tab
const userSockets = new Map();

let _io = null;

const initSocket = (io) => {
  _io = io;

  // Xác thực token khi client kết nối
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Thiếu token xác thực'));
    try {
      socket.user = verifyAccessToken(token);
      next();
    } catch {
      next(new Error('Token không hợp lệ'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.user_id;

    // Đăng ký socket vào danh sách của user
    if (!userSockets.has(userId)) userSockets.set(userId, new Set());
    userSockets.get(userId).add(socket.id);

    // Tham gia room riêng của user
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) userSockets.delete(userId);
      }
    });
  });
};

// Gửi sự kiện đến một user cụ thể (tất cả tab đang mở)
const emitToUser = (userId, event, data) => {
  if (_io) _io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, emitToUser };
