// Tự động khởi tạo schema và dữ liệu mẫu khi database còn trống
// Chạy mỗi lần server khởi động — an toàn vì kiểm tra bảng users trước
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'housekeeping_service',
      charset: 'utf8mb4',
      multipleStatements: true,
      ...(process.env.DB_SSL === 'true' && { ssl: { rejectUnauthorized: false } }),
    });

    // Kiểm tra bảng users đã tồn tại chưa
    const [[{ cnt }]] = await connection.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    );

    if (Number(cnt) > 0) {
      console.log('✅ Database đã có dữ liệu, bỏ qua khởi tạo.');
      return;
    }

    console.log('⚙️  Database trống — đang khởi tạo schema và dữ liệu mẫu...');

    // Đọc schema.sql, bỏ qua dòng CREATE DATABASE / USE (Aiven đã tạo sẵn DB)
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    schema = schema
      .replace(/CREATE\s+DATABASE\s[^;]+;/gi, '')
      .replace(/USE\s+\w+;/gi, '');

    await connection.query(schema);
    console.log('✅ Schema đã được tạo.');

    // Đọc sample_data.sql, bỏ qua dòng USE
    const dataPath = path.join(__dirname, '../../../database/sample_data.sql');
    let data = fs.readFileSync(dataPath, 'utf8');
    data = data.replace(/USE\s+\w+;/gi, '');

    await connection.query(data);
    console.log('✅ Dữ liệu mẫu đã được import thành công.');
    console.log('   Admin: admin@gmail.com / 123456');
  } catch (err) {
    console.error('❌ Lỗi khởi tạo database:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { initDatabase };
