// Job nhắc nhở lịch: chạy mỗi 5 phút, gửi thông báo trước 30 phút khi ca bắt đầu
const { pool } = require('../config/database');
const { pushNotification, mailIfOffline } = require('../utils/notify');
const { sendReminderEmail, sendShiftReminderEmail } = require('../utils/email');

async function sendBookingReminders() {
  try {
    // Lấy các booking confirmed sắp bắt đầu trong 25–35 phút tới, chưa gửi reminder
    // Dùng cửa sổ 10 phút để đảm bảo không bỏ sót dù job chạy mỗi 5 phút
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
         AND TIMESTAMP(b.booking_date, b.start_time) > NOW() + INTERVAL 25 MINUTE
         AND TIMESTAMP(b.booking_date, b.start_time) <= NOW() + INTERVAL 35 MINUTE`
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

      // Thông báo cho khách hàng
      await pushNotification({
        userId: b.customer_user_id,
        title: 'Nhắc nhở: Ca làm việc sắp bắt đầu',
        body: `Bạn có ca làm việc đã đăng ký lúc ${timeStr} ngày ${dateStr}. Người giúp việc: ${b.helper_name}. Vui lòng chuẩn bị sẵn sàng.`,
        type: 'system',
        refId: b.booking_id,
      });
      if (b.customer_email) {
        await sendReminderEmail(b.customer_email, b.customer_name, bookingInfo, b.helper_name, 'customer');
      }

      // Thông báo cho người giúp việc
      await pushNotification({
        userId: b.helper_user_id,
        title: 'Nhắc nhở: Ca làm việc sắp bắt đầu',
        body: `Bạn có ca làm việc đã đăng ký lúc ${timeStr} ngày ${dateStr} với khách ${b.customer_name}. Vui lòng chuẩn bị vào ca làm.`,
        type: 'system',
        refId: b.booking_id,
      });
      if (b.helper_email) {
        await sendReminderEmail(b.helper_email, b.helper_name, bookingInfo, b.customer_name, 'helper');
      }

      await pool.query('UPDATE bookings SET reminder_sent = 1 WHERE booking_id = ?', [b.booking_id]);
    }

    if (bookings.length > 0) {
      console.log(`📬 Đã gửi nhắc nhở cho ${bookings.length} booking sắp bắt đầu trong 30 phút.`);
    }
  } catch (err) {
    console.error('❌ Lỗi job nhắc nhở:', err.message);
  }
}

// Job nhắc nhở ca đăng ký (shift) sắp bắt đầu trong 30 phút
async function sendShiftReminders() {
  try {
    const [shifts] = await pool.query(
      `SELECT hsr.id, hsr.shift_date, hsr.start_time, hsr.end_time,
              u.user_id, u.full_name, u.email
       FROM helper_shift_registrations hsr
       JOIN helpers h ON hsr.helper_id = h.helper_id
       JOIN users   u ON h.user_id = u.user_id
       WHERE hsr.status = 'active'
         AND hsr.shift_reminder_sent = 0
         AND TIMESTAMP(hsr.shift_date, hsr.start_time) > NOW() + INTERVAL 25 MINUTE
         AND TIMESTAMP(hsr.shift_date, hsr.start_time) <= NOW() + INTERVAL 35 MINUTE`
    );

    for (const s of shifts) {
      const startTime = String(s.start_time).slice(0, 5);
      const endTime   = String(s.end_time).slice(0, 5);
      const dateStr   = new Date(s.shift_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

      await pushNotification({
        userId: s.user_id,
        title:  'Ca làm việc sắp bắt đầu',
        body:   `Ca ${startTime}–${endTime} ngày ${dateStr} của bạn sẽ bắt đầu sau 30 phút. Hãy chuẩn bị!`,
        type:   'system',
      });

      if (s.email) {
        await sendShiftReminderEmail(s.email, s.full_name, {
          shiftDate: s.shift_date,
          startTime,
          endTime,
        });
      }

      await pool.query(
        'UPDATE helper_shift_registrations SET shift_reminder_sent = 1 WHERE id = ?',
        [s.id]
      );
    }

    if (shifts.length > 0) {
      console.log(`📬 Đã gửi nhắc nhở ca làm cho ${shifts.length} helper.`);
    }
  } catch (err) {
    console.error('❌ Lỗi job nhắc nhở ca làm:', err.message);
  }
}

module.exports = { sendBookingReminders, sendShiftReminders };
