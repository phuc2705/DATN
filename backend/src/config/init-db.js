// Tự động khởi tạo schema, dữ liệu mẫu và chạy migration khi server khởi động
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// mysql2 không hỗ trợ DELIMITER (đó là lệnh MySQL CLI).
// Hàm này tách stored procedures/triggers ra khỏi SQL thường để chạy riêng.
function parseSqlWithDelimiters(sql) {
  const regularParts = [];
  const procedureSqls = [];
  const delimiterRegex = /DELIMITER\s*\$\$([\s\S]*?)DELIMITER\s*;/gi;
  let lastIndex = 0;
  let match;
  while ((match = delimiterRegex.exec(sql)) !== null) {
    regularParts.push(sql.slice(lastIndex, match.index));
    const stmts = match[1].split('$$').map(s => s.trim()).filter(Boolean);
    procedureSqls.push(...stmts);
    lastIndex = match.index + match[0].length;
  }
  regularParts.push(sql.slice(lastIndex));
  return { regularSql: regularParts.join('\n'), procedureSqls };
}

// Migration idempotent: phone và password_hash cần nullable để hỗ trợ OAuth users
async function runMigrations(connection) {
  try {
    await connection.query('ALTER TABLE users MODIFY COLUMN phone VARCHAR(15) UNIQUE NULL');
    await connection.query('ALTER TABLE users MODIFY COLUMN password_hash VARCHAR(255) NULL');
  } catch (err) {
    // ignore — đã chạy rồi
  }

  // Migration v2: cập nhật 12 dịch vụ đầy đủ
  try {
    const [[svc1]] = await connection.query('SELECT service_name FROM services WHERE service_id = 1');
    if (svc1 && svc1.service_name !== 'Giúp việc theo giờ') {
      console.log('⚙️  Đang chạy migration services v2...');
      const migPath = require('path').join(__dirname, '../../../database/migrate_services_v2.sql');
      let sql = require('fs').readFileSync(migPath, 'utf8');
      sql = sql.replace(/USE\s+\w+;/gi, '').replace(/--[^\n]*/g, '');
      // Tách thành từng statement riêng để chạy
      const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 10);
      for (const stmt of stmts) {
        await connection.query(stmt);
      }
      console.log('✅ Migration services v2 hoàn tất — 12 dịch vụ đã cập nhật.');
    }
  } catch (err) {
    console.error('⚠️  Migration services v2 warning:', err.message);
  }

  console.log('✅ Migrations hoàn tất.');
}

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

    const [[{ cnt }]] = await connection.query(
      "SELECT COUNT(*) AS cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
    );

    if (Number(cnt) > 0 && process.env.FORCE_REINIT === 'true') {
      // FORCE_REINIT=true → drop toàn bộ bảng rồi khởi tạo lại từ đầu
      console.log('⚠️  FORCE_REINIT=true — đang xóa toàn bộ bảng...');
      await connection.query('SET FOREIGN_KEY_CHECKS = 0');
      const [tables] = await connection.query(
        'SELECT TABLE_NAME AS tname FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
      );
      for (const row of tables) {
        await connection.query(`DROP TABLE IF EXISTS \`${row.tname}\``);
      }
      await connection.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log(`✅ Đã xóa ${tables.length} bảng.`);
    } else if (Number(cnt) > 0) {
      // Bảng tồn tại → kiểm tra xem có user nào chưa
      const [[{ userCount }]] = await connection.query('SELECT COUNT(*) AS userCount FROM users');
      if (Number(userCount) === 0) {
        // Bảng có nhưng users rỗng → chỉ chạy seed data, không chạy lại schema
        console.log('⚙️  Bảng tồn tại nhưng chưa có dữ liệu — đang import dữ liệu mẫu...');
        const dataPath = path.join(__dirname, '../../../database/sample_data.sql');
        let data = fs.readFileSync(dataPath, 'utf8');
        data = data.replace(/USE\s+\w+;/gi, '');
        await connection.query(data);
        console.log('✅ Dữ liệu mẫu đã được import thành công.');
        console.log('   Admin  : admin@gmail.com / 123456');
        console.log('   Customer: nguyenvanbay@gmail.com / 123456');
        console.log('   Helper  : nguyenthimai@gmail.com / 123456');
      } else {
        console.log('✅ Database đã có dữ liệu, bỏ qua khởi tạo.');
      }
      // Luôn chạy migrations (idempotent) trước khi kết thúc
      await runMigrations(connection);
      return;
    }

    console.log('⚙️  Đang khởi tạo schema...');

    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    let schema = fs.readFileSync(schemaPath, 'utf8');
    // Bỏ CREATE DATABASE và USE (Aiven đã tạo DB sẵn)
    schema = schema
      .replace(/CREATE\s+DATABASE\s[^;]+;/gi, '')
      .replace(/USE\s+\w+;/gi, '');

    // Chạy SQL thường (CREATE TABLE, INDEX...) với multipleStatements
    const { regularSql, procedureSqls } = parseSqlWithDelimiters(schema);
    await connection.query(regularSql);

    // Chạy từng stored procedure / trigger riêng lẻ (không dùng DELIMITER)
    for (const proc of procedureSqls) {
      if (proc.trim()) await connection.query(proc);
    }
    console.log('✅ Schema đã được tạo.');

    console.log('⚙️  Đang import dữ liệu mẫu...');
    const dataPath = path.join(__dirname, '../../../database/sample_data.sql');
    let data = fs.readFileSync(dataPath, 'utf8');
    data = data.replace(/USE\s+\w+;/gi, '');
    await connection.query(data);

    console.log('✅ Dữ liệu mẫu đã được import thành công.');
    console.log('   Admin  : admin@gmail.com / 123456');
    console.log('   Customer: nguyenvanbay@gmail.com / 123456');
    console.log('   Helper  : nguyenthimai@gmail.com / 123456');

    await runMigrations(connection);
  } catch (err) {
    console.error('❌ Lỗi khởi tạo database:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

module.exports = { initDatabase };
