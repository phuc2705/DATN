// Tiện ích đánh giá uy tín khách hàng dựa trên tỷ lệ hoàn thành lịch hẹn
const { pool } = require('../config/database');

// Ngưỡng tỷ lệ hoàn thành tối thiểu để được dùng tiền mặt
const TRUST_THRESHOLD = 0.6; // 60%
// Tỷ lệ đặt cọc bắt buộc cho khách hàng mới hoặc uy tín thấp
const DEPOSIT_RATE = 0.70; // 70%

// Tính toán thông tin uy tín của khách hàng
async function getCustomerTrustInfo(customerId) {
  const [[stats]] = await pool.query(
    `SELECT
       COUNT(*) AS total_bookings,
       SUM(CASE WHEN status = 'completed'  THEN 1 ELSE 0 END) AS completed_bookings,
       SUM(CASE WHEN status = 'cancelled'  THEN 1 ELSE 0 END) AS cancelled_bookings
     FROM bookings
     WHERE customer_id = ?`,
    [customerId]
  );

  const total     = Number(stats.total_bookings     || 0);
  const completed = Number(stats.completed_bookings || 0);
  const cancelled = Number(stats.cancelled_bookings || 0);

  // Tỷ lệ hoàn thành tính trên tổng lịch đã đặt (bao gồm cả đang chờ/đang làm)
  const completionRate        = total > 0 ? completed / total : 0;
  const completionRatePercent = Math.round(completionRate * 100);

  const isNewCustomer         = total === 0;
  const isTrusted             = !isNewCustomer && completionRate >= TRUST_THRESHOLD;
  // Chỉ khách hàng mới (chưa từng đặt lịch) mới bắt buộc đặt cọc 70% qua VNPay
  const requiresOnlinePayment = isNewCustomer;

  return {
    totalBookings:          total,
    completedBookings:      completed,
    cancelledBookings:      cancelled,
    completionRate,
    completionRatePercent,
    isNewCustomer,
    isTrusted,
    requiresOnlinePayment,
    trustThreshold:        TRUST_THRESHOLD,
    trustThresholdPercent: Math.round(TRUST_THRESHOLD * 100),
  };
}

module.exports = { getCustomerTrustInfo, TRUST_THRESHOLD, DEPOSIT_RATE };
