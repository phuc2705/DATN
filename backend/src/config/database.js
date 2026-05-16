// Cấu hình kết nối MySQL sử dụng Connection Pool để tối ưu hiệu suất
// Pool cho phép tái sử dụng kết nối thay vì tạo mới mỗi request
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'housekeeping_service',
  waitForConnections: true,
  connectionLimit: 10,      // Tối đa 10 kết nối đồng thời
  queueLimit: 0,            // Không giới hạn hàng đợi
  charset: 'utf8mb4',
  timezone: '+07:00',       // Múi giờ Việt Nam
  ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
});

// Hàm kiểm tra kết nối database khi khởi động server
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    connection.release();
  } catch (error) {
    console.error('❌ Lỗi kết nối MySQL:', error.message);
    process.exit(1); // Dừng server nếu không kết nối được DB
  }
};

module.exports = { pool, testConnection };
