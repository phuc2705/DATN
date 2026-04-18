// Model Service - quản lý dịch vụ và lịch làm việc của helper
const { pool } = require('../config/database');

const ServiceModel = {
  // Lấy tất cả dịch vụ đang hoạt động
  findAll: async () => {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE is_active = TRUE ORDER BY service_name'
    );
    return rows;
  },

  // Tìm dịch vụ theo ID
  findById: async (serviceId) => {
    const [rows] = await pool.query(
      'SELECT * FROM services WHERE service_id = ? AND is_active = TRUE',
      [serviceId]
    );
    return rows[0] || null;
  },

  // Admin: tạo dịch vụ mới
  create: async ({ serviceName, description, basePrice, iconUrl, slug }) => {
    const [result] = await pool.query(
      'INSERT INTO services (service_name, description, base_price, icon_url, slug) VALUES (?, ?, ?, ?, ?)',
      [serviceName, description, basePrice, iconUrl, slug]
    );
    return result.insertId;
  },

  // Tìm kiếm helper theo dịch vụ và địa điểm (kèm điểm đánh giá)
  findHelpersByService: async (serviceId, city = null) => {
    let query = `
      SELECT u.user_id, u.full_name, u.avatar_url, u.last_seen_at,
             h.helper_id, h.rating_average, h.total_bookings, h.experience_years,
             h.is_verified, h.is_available, h.hourly_rate, h.bio,
             COALESCE(hs.custom_price, s.base_price) AS effective_price,
             hs.experience_level
      FROM helpers h
      JOIN users u ON h.user_id = u.user_id
      JOIN helper_services hs ON h.helper_id = hs.helper_id
      JOIN services s ON hs.service_id = s.service_id
      WHERE hs.service_id = ?
        AND h.is_available = TRUE
        AND u.is_active = TRUE
    `;
    const params = [serviceId];

    if (city) {
      query += ' AND h.address LIKE ?';
      params.push(`%${city}%`);
    }

    query += ' ORDER BY h.rating_average DESC, h.total_bookings DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Lấy lịch làm việc của helper
  getHelperSchedule: async (helperId) => {
    const [rows] = await pool.query(
      'SELECT * FROM schedules WHERE helper_id = ? AND is_available = TRUE ORDER BY FIELD(day_of_week, "monday","tuesday","wednesday","thursday","friday","saturday","sunday")',
      [helperId]
    );
    return rows;
  },

  // Helper đăng ký cung cấp dịch vụ
  addHelperService: async (helperId, serviceId, experienceLevel, customPrice = null) => {
    const [result] = await pool.query(
      'INSERT INTO helper_services (helper_id, service_id, experience_level, custom_price) VALUES (?, ?, ?, ?)',
      [helperId, serviceId, experienceLevel, customPrice]
    );
    return result.insertId;
  },
};

module.exports = ServiceModel;
