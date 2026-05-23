// Model cấu hình hệ thống — đọc/ghi các cài đặt từ bảng system_settings
const { pool } = require('../config/database');

const SettingModel = {
  // Lấy giá trị của một setting theo key
  get: async (key) => {
    const [[row]] = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = ?', [key]
    );
    return row?.setting_value ?? null;
  },

  // Cập nhật hoặc tạo mới một setting (upsert)
  set: async (key, value) => {
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, String(value)]
    );
  },

  // Lấy tất cả settings dưới dạng object { key: value }
  getAll: async () => {
    const [rows] = await pool.query('SELECT setting_key, setting_value FROM system_settings');
    return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
  },
};

module.exports = SettingModel;
