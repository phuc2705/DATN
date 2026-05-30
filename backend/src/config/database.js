// Cấu hình kết nối MySQL sử dụng Connection Pool để tối ưu hiệu suất
const mysql = require('mysql2/promise');

const IS_PROD = process.env.NODE_ENV === 'production';

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'housekeeping_service',
  charset:  'utf8mb4',
  timezone: '+07:00',             // Múi giờ Việt Nam

  // Pool settings — Aiven free tier giới hạn 5 connections đồng thời
  waitForConnections: true,
  connectionLimit:    IS_PROD ? 5 : 10,
  queueLimit:         0,

  // Giữ kết nối sống để tránh bị timeout bởi cloud MySQL (Aiven/PlanetScale)
  enableKeepAlive:    true,
  keepAliveInitialDelay: 10000,

  // Tự reconnect khi mất kết nối
  idleTimeout:        60000,      // Đóng kết nối rảnh sau 60 giây
  maxIdle:            IS_PROD ? 3 : 5,

  // SSL bắt buộc với Aiven MySQL
  ...(process.env.DB_SSL === 'true' && {
    ssl: { rejectUnauthorized: false },
  }),
});

// Kiểm tra kết nối DB khi khởi động server
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    conn.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
