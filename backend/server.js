// Entry point của Backend Server
require('dotenv').config(); // Nạp biến môi trường từ .env trước tất cả

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { testConnection, pool } = require('./src/config/database');
const { initDatabase } = require('./src/config/init-db');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');
const { initSocket } = require('./src/socket');
const { sendBookingReminders } = require('./src/jobs/reminderJob');
const { autoAssignExpiredBookings } = require('./src/jobs/autoAssignJob');

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

// ─── Static files (trước CORS — không cần CORS check) ────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// ─── Body parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS chỉ cho /api (localhost + CLIENT_URL) ───────────────────────────────
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://connectclean.id.vn',
  'https://www.connectclean.id.vn',
  'https://datn-fafj.onrender.com',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use('/api', cors(corsOptions));

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

// ─── Catch-all: trả về index.html cho React Router ───────────────────────────
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
  await initDatabase();   // Tự động tạo schema + dữ liệu mẫu nếu DB còn trống
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`📋 Môi trường: ${process.env.NODE_ENV}`);
    console.log(`🔌 Socket.io đang lắng nghe`);
  });
  cleanupExpiredAccounts();
  setInterval(cleanupExpiredAccounts, 60 * 1000);

  // Job nhắc nhở lịch đặt (mỗi 30 phút)
  sendBookingReminders();
  setInterval(sendBookingReminders, 30 * 60 * 1000);

  // Job tự động giao việc: booking pending > 30 phút không có helper → gán tự động hoặc báo admin
  autoAssignExpiredBookings();
  setInterval(autoAssignExpiredBookings, 30 * 60 * 1000);
};

startServer();
