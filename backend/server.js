// Entry point của Backend Server
require('dotenv').config(); // Nạp biến môi trường từ .env trước tất cả

const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { testConnection } = require('./src/config/database');
const { initDatabase } = require('./src/config/init-db');
const { errorHandler } = require('./src/middleware/errorHandler');
const { initSocket } = require('./src/socket');
const { startBookingTimeoutJob } = require('./src/jobs/bookingTimeout');
const { sendBookingReminders, sendShiftReminders } = require('./src/jobs/reminderJob');
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
const feedbackRoutes = require('./src/routes/feedback.routes');

const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ─── Danh sách origin được phép CORS ─────────────────────────────────────────
// Phải định nghĩa TRƯỚC khi tạo Socket.io
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5000',
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://connectclean.onrender.com',
].filter(Boolean);

const isOriginAllowed = (origin) =>
  !origin ||
  /^http:\/\/localhost:\d+$/.test(origin) ||
  /^http:\/\/172\.\d+\.\d+\.\d+:\d+$/.test(origin) ||
  allowedOrigins.includes(origin);

// ─── Khởi tạo app + Socket.io ────────────────────────────────────────────────
const app = express();
// Render (và các reverse proxy) đặt X-Forwarded-For — phải bật trust proxy
// để express-rate-limit và IP detection hoạt động đúng trên production
app.set('trust proxy', 1);
const httpServer = createServer(app);

// Fix: không dùng origin:'*' khi credentials:true — trình duyệt sẽ block
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => cb(null, isOriginAllowed(origin)),
    credentials: true,
  },
  // Tăng ping timeout để tránh ngắt kết nối khi Render cold-start chậm
  pingTimeout: 60000,
  pingInterval: 25000,
});
initSocket(io);

// ─── Static files (phải TRƯỚC CORS middleware) ───────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), {
  maxAge: IS_PROD ? '7d' : 0,
}));

// Serve React app (chỉ khi đã build — production hoặc local demo)
const distPath = path.join(__dirname, '../frontend/dist');

// Assets có content-hash trong tên file → cache dài (1 năm, immutable)
app.use('/assets', express.static(path.join(distPath, 'assets'), {
  maxAge: IS_PROD ? '1y' : 0,
  immutable: IS_PROD,
}));

// index.html và các file tĩnh gốc (logo, favicon...) → KHÔNG cache
// để browser luôn lấy phiên bản mới nhất sau mỗi lần deploy
app.use(express.static(distPath, {
  maxAge: 0,
  etag: true,
  lastModified: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  },
}));

// ─── Body parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── CORS cho /api ────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) callback(null, true);
    else callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
};
app.use('/api', cors(corsOptions));

// ─── Health Check (Render dùng để wake-up + monitor) ─────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
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
app.use('/api/feedback', feedbackRoutes);

// ─── API 404 — route /api/* không tìm thấy ────────────────────────────────────
app.all('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Không tìm thấy: ${req.method} ${req.path}` });
});

// ─── Catch-all: trả về index.html cho React Router (SPA) ─────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    // Luôn no-cache cho index.html — đảm bảo deploy mới được nhận ngay
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(indexPath);
  } else {
    res.status(503).json({
      success: false,
      message: 'Frontend chưa được build. Chạy: cd frontend && npm run build',
    });
  }
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Khởi động Server ─────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await testConnection();

    // Listen ngay để Render health check không timeout (migrations chạy nền)
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n🚀 Server: http://localhost:${PORT}`);
      console.log(`📋 Môi trường: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io: bật`);
      if (IS_PROD) {
        console.log(`🌐 Production URL: ${process.env.CLIENT_URL || `http://localhost:${PORT}`}`);
      }
      startBookingTimeoutJob();
      sendBookingReminders();
      setInterval(sendBookingReminders, 5 * 60 * 1000);      // nhắc nhở đơn hàng trước 30 phút
      sendShiftReminders();
      setInterval(sendShiftReminders, 5 * 60 * 1000);        // nhắc nhở ca làm trước 30 phút
      autoAssignExpiredBookings();
      setInterval(autoAssignExpiredBookings, 5 * 60 * 1000); // tự gán helper sau 30 phút chờ
    });

    // Migrations chạy nền — không block server startup
    initDatabase().catch(err => console.error('❌ initDatabase error:', err.message));
  } catch (err) {
    console.error('❌ Khởi động thất bại:', err.message);
    process.exit(1);
  }
};

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  console.log(`\n${signal} nhận được — đang tắt server...`);
  httpServer.close(() => {
    console.log('✅ Server đã tắt.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // Force exit sau 10s
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

startServer();
