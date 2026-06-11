// Thuật toán điều phối (Matching) — xếp hạng helper theo tiêu chí đa chiều
const { pool } = require('../config/database');

// Điểm kinh nghiệm (0-1) theo cấp độ
const EXPERIENCE_SCORE = { beginner: 0.3, intermediate: 0.6, expert: 1.0 };

/**
 * Chấm điểm một helper (0-100, +15 bonus nếu có ca đăng ký khớp)
 * Rating 40% + Kinh nghiệm 30% + Tải công việc 20% + Sẵn sàng 10% + Ca đăng ký +15
 */
const scoreHelper = (helper) => {
  const ratingScore    = (parseFloat(helper.rating_average || 0) / 5) * 40;
  const expScore       = (EXPERIENCE_SCORE[helper.experience_level] || 0.3) * 30;
  const workloadScore  = Math.max(0, 1 - ((helper.active_bookings || 0) / 10)) * 20;
  const availScore     = helper.is_available ? 10 : 0;
  const shiftBonus     = helper.has_shift_match ? 15 : 0;
  return Math.round(ratingScore + expScore + workloadScore + availScore + shiftBonus);
};

/**
 * Tìm và xếp hạng danh sách helper phù hợp cho một booking
 * - Ưu tiên helper có ca đăng ký trùng khung giờ (+15 điểm)
 * - Loại bỏ helper vi phạm quy tắc 30 phút nghỉ giữa các ca
 * @param {number}  serviceId
 * @param {string}  bookingDate  "YYYY-MM-DD" (optional — nếu null bỏ qua conflict check)
 * @param {string}  startTime    "HH:MM"
 * @param {string}  endTime      "HH:MM"
 */
const findSuggestedHelpers = async ({ serviceId, bookingDate, startTime, endTime }) => {
  const useConflictCheck = bookingDate && startTime && endTime;

  // Loại helper đang bị trùng giờ
  const conflictClause = useConflictCheck
    ? `AND NOT EXISTS (
         SELECT 1 FROM bookings b_conflict
         WHERE b_conflict.helper_id = h.helper_id
           AND b_conflict.booking_date = ?
           AND b_conflict.status NOT IN ('cancelled')
           AND b_conflict.start_time < ? AND b_conflict.end_time > ?
       )`
    : '';

  // Loại helper vi phạm quy tắc 30 phút nghỉ giữa các ca
  const gapClause = useConflictCheck
    ? `AND NOT EXISTS (
         SELECT 1 FROM bookings b_gap
         WHERE b_gap.helper_id = h.helper_id
           AND b_gap.booking_date = ?
           AND b_gap.status NOT IN ('cancelled')
           AND (
             (TIME_TO_SEC(b_gap.end_time) <= TIME_TO_SEC(?) AND TIME_TO_SEC(?) - TIME_TO_SEC(b_gap.end_time) < 1800)
             OR
             (TIME_TO_SEC(b_gap.start_time) >= TIME_TO_SEC(?) AND TIME_TO_SEC(b_gap.start_time) - TIME_TO_SEC(?) < 1800)
           )
       )`
    : '';

  // Kiểm tra helper có ca đăng ký giao thoa với booking không (để ưu tiên điểm cao hơn)
  const shiftJoin = useConflictCheck
    ? `LEFT JOIN (
         SELECT DISTINCT helper_id
         FROM helper_shift_registrations
         WHERE shift_date = ? AND status = 'active'
           AND NOT (end_time <= ? OR start_time >= ?)
       ) shift_reg ON shift_reg.helper_id = h.helper_id`
    : '';

  // Thứ tự params theo vị trí ? trong query: shiftJoin trước WHERE, conflict/gap sau
  const shiftParams    = useConflictCheck ? [bookingDate, startTime, endTime] : [];
  const conflictParams = useConflictCheck ? [bookingDate, endTime, startTime] : [];
  const gapParams      = useConflictCheck ? [bookingDate, startTime, startTime, endTime, endTime] : [];

  // shiftParams đứng trước serviceId vì LEFT JOIN nằm trước WHERE trong SQL
  const allParams = [...shiftParams, serviceId, ...conflictParams, ...gapParams];

  const [rows] = await pool.query(`
    SELECT
      h.helper_id, h.is_verified, h.is_available,
      h.rating_average, h.total_bookings, h.experience_years, h.bio,
      u.full_name, u.avatar_url,
      hs.experience_level, hs.custom_price,
      s.base_price,
      (SELECT COUNT(*) FROM bookings b2
       WHERE b2.helper_id = h.helper_id
         AND b2.status IN ('pending','confirmed','in_progress')) AS active_bookings,
      ${useConflictCheck ? '(shift_reg.helper_id IS NOT NULL) AS has_shift_match' : '0 AS has_shift_match'}
    FROM helpers h
    JOIN users u ON h.user_id = u.user_id
    JOIN helper_services hs ON h.helper_id = hs.helper_id
    JOIN services s ON hs.service_id = s.service_id
    ${shiftJoin}
    WHERE hs.service_id = ?
      AND h.is_verified = TRUE
      AND h.is_available = TRUE
      AND u.is_active = TRUE
      AND u.user_type != 'admin'
      ${conflictClause}
      ${gapClause}
  `, allParams);

  return rows
    .map(h => ({ ...h, score: scoreHelper(h) }))
    .sort((a, b) => b.score - a.score);
};

module.exports = { findSuggestedHelpers, scoreHelper, EXPERIENCE_SCORE };
