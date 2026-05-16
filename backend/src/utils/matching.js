// Thuật toán điều phối (Matching) — xếp hạng helper theo tiêu chí đa chiều
const { pool } = require('../config/database');

// Điểm kinh nghiệm (0-1) theo cấp độ
const EXPERIENCE_SCORE = { beginner: 0.3, intermediate: 0.6, expert: 1.0 };

/**
 * Chấm điểm một helper (0-100)
 * Rating 40% + Kinh nghiệm 30% + Tải công việc 20% + Sẵn sàng 10%
 */
const scoreHelper = (helper) => {
  const ratingScore    = (parseFloat(helper.rating_average || 0) / 5) * 40;
  const expScore       = (EXPERIENCE_SCORE[helper.experience_level] || 0.3) * 30;
  const workloadScore  = Math.max(0, 1 - ((helper.active_bookings || 0) / 10)) * 20;
  const availScore     = helper.is_available ? 10 : 0;
  return Math.round(ratingScore + expScore + workloadScore + availScore);
};

/**
 * Tìm và xếp hạng danh sách helper phù hợp cho một booking
 * @param {number}  serviceId
 * @param {string}  bookingDate  "YYYY-MM-DD" (optional — nếu null bỏ qua conflict check)
 * @param {string}  startTime    "HH:MM"
 * @param {string}  endTime      "HH:MM"
 */
const findSuggestedHelpers = async ({ serviceId, bookingDate, startTime, endTime }) => {
  const useConflictCheck = bookingDate && startTime && endTime;

  const conflictClause = useConflictCheck
    ? `AND NOT EXISTS (
         SELECT 1 FROM bookings b
         WHERE b.helper_id = h.helper_id
           AND b.booking_date = ?
           AND b.status NOT IN ('cancelled')
           AND b.start_time < ? AND b.end_time > ?
       )`
    : '';

  const params = [serviceId];
  if (useConflictCheck) params.push(bookingDate, endTime, startTime);

  const [rows] = await pool.query(`
    SELECT
      h.helper_id, h.is_verified, h.is_available,
      h.rating_average, h.total_bookings, h.experience_years, h.bio,
      u.full_name, u.avatar_url,
      hs.experience_level, hs.custom_price,
      s.base_price,
      (SELECT COUNT(*) FROM bookings b2
       WHERE b2.helper_id = h.helper_id
         AND b2.status IN ('pending','confirmed','in_progress')) AS active_bookings
    FROM helpers h
    JOIN users u ON h.user_id = u.user_id
    JOIN helper_services hs ON h.helper_id = hs.helper_id
    JOIN services s ON hs.service_id = s.service_id
    WHERE hs.service_id = ?
      AND h.is_verified = TRUE
      AND h.is_available = TRUE
      AND u.is_active = TRUE
      ${conflictClause}
  `, params);

  return rows
    .map(h => ({ ...h, score: scoreHelper(h) }))
    .sort((a, b) => b.score - a.score);
};

module.exports = { findSuggestedHelpers, scoreHelper, EXPERIENCE_SCORE };
