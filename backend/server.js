// Entry point của Backend Server
require('dotenv').config(); // Nạp biến môi trường từ .env trước tất cả

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { testConnection, pool } = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { initSocket } = require('./src/socket');

// Import các router
const authRoutes = require('./src/routes/auth.routes');
const serviceRoutes = require('./src/routes/service.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const userRoutes = require('./src/routes/user.routes');
const reviewRoutes = require('./src/routes/review.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const adminRoutes = require('./src/routes/admin.routes');
const notificationRoutes = require('./src/routes/notification.routes');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', credentials: true },
});
initSocket(io);
const PORT = process.env.PORT || 5000;

// ─── Middleware toàn cục ──────────────────────────────────────────────────────

// Cho phép CORS từ localhost (mọi port) và CLIENT_URL trong .env
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else if (origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Parse JSON body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ─── Serve ảnh upload (avatars, ...) ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ─── Serve React Frontend (build) ────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// ─── Xử lý lỗi (phải đặt SAU tất cả routes) ─────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Dọn dẹp tài khoản chưa xác minh sau 5 phút (OTP hết hạn) ───────────────
const cleanupExpiredAccounts = async () => {
  try {
    await pool.query(
      `DELETE FROM users WHERE is_active = 0 AND created_at < NOW() - INTERVAL 5 MINUTE`
    );
  } catch { /* bỏ qua lỗi */ }
};

// ─── Khởi động Server ─────────────────────────────────────────────────────────
const startServer = async () => {
  await testConnection(); // Kiểm tra DB trước khi mở cổng
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📋 Môi trường: ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.io đang lắng nghe`);
  });
  cleanupExpiredAccounts(); // Chạy ngay khi khởi động để dọn dẹp tồn đọng
  setInterval(cleanupExpiredAccounts, 60 * 1000); // Chạy mỗi 60 giây
};

startServer();
