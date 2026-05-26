// Job nhắc nhở lịch: chạy mỗi 30 phút, gửi thông báo cho booking sắp đến trong 24h
const { pool } = require('../config/database');
const { pushNotification, mailIfOffline } = require('../utils/notify');
const { sendReminderEmail } = require('../utils/email');

async function sendBookingReminders() {
  try {
    // Lấy các booking đã confirmed, sắp diễn ra trong 1–24h tới, chưa gửi reminder
    const [bookings] = await pool.query(
      `SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.address,
              s.service_name,
              uc.user_id AS customer_user_id, uc.full_name AS customer_name, uc.email AS customer_email,
              uh.user_id AS helper_user_id, uh.full_name AS helper_name, uh.email AS helper_email
       FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN users uc ON c.user_id = uc.user_id
       JOIN helpers h ON b.helper_id = h.helper_id
       JOIN users uh ON h.user_id = uh.user_id
       WHERE b.status = 'confirmed'
         AND b.reminder_sent = 0
         AND TIMESTAMP(b.booking_date, b.start_time) > NOW() + INTERVAL 1 HOUR
         AND TIMESTAMP(b.booking_date, b.start_time) <= NOW() + INTERVAL 24 HOUR`
    );

    for (const b of bookings) {
      const timeStr = String(b.start_time).slice(0, 5); // HH:MM
      const dateObj = new Date(b.booking_date);
      const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const bookingInfo = {
        bookingId: b.booking_id, serviceName: b.service_name,
        bookingDate: b.booking_date, startTime: String(b.start_time).slice(0, 5),
        endTime: String(b.end_time).slice(0, 5), address: b.address,
      };

      await pushNotification({
        userId: b.customer_user_id,
        title: 'Nhắc nhở: Lịch sắp tới của bạn',
        body: `${b.service_name} lúc ${timeStr} ngày ${dateStr}. Người giúp việc: ${b.helper_name}.`,
        type: 'system',
        refId: b.booking_id,
      });
      if (b.customer_email) {
        mailIfOffline(b.customer_user_id, () => sendReminderEmail(
          b.customer_email, b.customer_name, bookingInfo, b.helper_name, 'customer'
        ));
      }

      await pushNotification({
        userId: b.helper_user_id,
        title: 'Nhắc nhở: Lịch làm việc sắp tới',
        body: `Bạn có lịch ${b.service_name} lúc ${timeStr} ngày ${dateStr} với khách ${b.customer_name}.`,
        type: 'system',
        refId: b.booking_id,
      });
      if (b.helper_email) {
        mailIfOffline(b.helper_user_id, () => sendReminderEmail(
          b.helper_email, b.helper_name, bookingInfo, b.customer_name, 'helper'
        ));
      }

      await pool.query('UPDATE bookings SET reminder_sent = 1 WHERE booking_id = ?', [b.booking_id]);
    }

    if (bookings.length > 0) {
      console.log(`📬 Đã gửi nhắc nhở cho ${bookings.length} booking sắp diễn ra.`);
    }
  } catch (err) {
    console.error('❌ Lỗi job nhắc nhở:', err.message);
  }
}

module.exports = { sendBookingReminders };
