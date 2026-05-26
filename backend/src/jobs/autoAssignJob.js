// Job tự động giao việc: sau 30 phút không có helper nhận, hệ thống tự gán helper tốt nhất
// Nếu không tìm được helper phù hợp, thông báo admin xử lý thủ công
const { pool } = require('../config/database');
const BookingModel = require('../models/booking.model');
const { findSuggestedHelpers } = require('../utils/matching');
const { pushNotification, mailIfOffline } = require('../utils/notify');
const { sendJobAcceptedEmail, sendNewJobEmail } = require('../utils/email');

async function autoAssignExpiredBookings() {
  try {
    // Lấy các booking ở trạng thái pending, chưa có helper, đã tạo > 30 phút
    const [bookings] = await pool.query(`
      SELECT b.booking_id, b.service_id, b.booking_date, b.start_time, b.end_time, b.address,
             uc.user_id AS customer_user_id, uc.full_name AS customer_name, uc.email AS customer_email,
             s.service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.service_id
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users uc ON c.user_id = uc.user_id
      WHERE b.status = 'pending'
        AND b.helper_id IS NULL
        AND b.created_at <= NOW() - INTERVAL 30 MINUTE
    `);

    if (bookings.length === 0) return;

    // Lấy user_id của admin để ghi log
    const [[admin]] = await pool.query(
      "SELECT user_id FROM users WHERE user_type = 'admin' AND is_active = 1 LIMIT 1"
    );
    const adminUserId = admin?.user_id;

    for (const booking of bookings) {
      const dateStr = booking.booking_date instanceof Date
        ? booking.booking_date.toISOString().slice(0, 10)
        : String(booking.booking_date).slice(0, 10);

      // Tìm helper phù hợp nhất bằng thuật toán matching
      const candidates = await findSuggestedHelpers({
        serviceId:   booking.service_id,
        bookingDate: dateStr,
        startTime:   String(booking.start_time).slice(0, 5),
        endTime:     String(booking.end_time).slice(0, 5),
      });

      if (candidates.length > 0) {
        const best = candidates[0];

        // Gán helper và chuyển trạng thái pending → confirmed
        await BookingModel.assignHelperAndConfirm(
          booking.booking_id, best.helper_id, adminUserId
        );

        const bookingInfo = {
          bookingId: booking.booking_id, serviceName: booking.service_name,
          bookingDate: dateStr, startTime: String(booking.start_time).slice(0, 5),
          endTime: String(booking.end_time).slice(0, 5), address: booking.address,
        };

        // Thông báo khách hàng
        await pushNotification({
          userId: booking.customer_user_id,
          title:  'Đã tìm được người giúp việc!',
          body:   `Đơn ${booking.booking_id} (${booking.service_name}) đã được giao cho ${best.full_name}.`,
          type:   'booking_confirmed',
          refId:  booking.booking_id,
        });
        if (booking.customer_email) {
          mailIfOffline(booking.customer_user_id, () => sendJobAcceptedEmail(
            booking.customer_email, booking.customer_name, bookingInfo, best.full_name
          ));
        }

        // Thông báo helper được giao
        const [[helperUser]] = await pool.query(
          'SELECT u.user_id, u.email, u.full_name FROM helpers h JOIN users u ON h.user_id = u.user_id WHERE h.helper_id = ?',
          [best.helper_id]
        );
        if (helperUser) {
          await pushNotification({
            userId: helperUser.user_id,
            title:  'Hệ thống giao việc cho bạn!',
            body:   `Bạn được chỉ định làm ${booking.service_name} vào ngày ${dateStr} lúc ${String(booking.start_time).slice(0, 5)}.`,
            type:   'booking_confirmed',
            refId:  booking.booking_id,
          });
          if (helperUser.email) {
            mailIfOffline(helperUser.user_id, () => sendNewJobEmail(
              helperUser.email, helperUser.full_name, bookingInfo
            ));
          }
        }

        console.log(`✅ Auto-assign: Đơn ${booking.booking_id} → ${best.full_name} (helper_id=${best.helper_id})`);
      } else {
        // Không tìm được helper → báo admin xử lý thủ công
        if (adminUserId) {
          await pushNotification({
            userId: adminUserId,
            title:  '⚠️ Cần giao việc thủ công',
            body:   `Đơn ${booking.booking_id} (${booking.service_name}, ${dateStr}) không tìm được helper khả dụng sau 30 phút.`,
            type:   'booking_confirmed',
            refId:  booking.booking_id,
          });
        }
        console.log(`⚠️  Auto-assign: Đơn ${booking.booking_id} không có helper khả dụng — đã báo admin.`);
      }
    }

    if (bookings.length > 0) {
      console.log(`🤖 Auto-assign: Xử lý ${bookings.length} đơn chờ quá 30 phút.`);
    }
  } catch (err) {
    console.error('❌ Lỗi auto-assign job:', err.message);
  }
}

module.exports = { autoAssignExpiredBookings };
