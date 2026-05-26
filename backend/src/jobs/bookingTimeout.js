// Job tự động hủy booking hết hạn chờ và leo thang thông báo
const { pool } = require('../config/database');
const { pushNotification, mailIfOffline } = require('../utils/notify');
const { emitToUser } = require('../socket');
const { sendCancelledEmail } = require('../utils/email');

// Quy tắc timeout:
// - Lịch đã qua giờ bắt đầu → hủy ngay
// - Lịch cùng ngày: timeout sau 2 tiếng từ lúc tạo
// - Lịch ngày tương lai: timeout sau 4 tiếng từ lúc tạo
async function cancelExpiredBookings() {
  let connection;
  try {
    connection = await pool.getConnection();

    const [expired] = await connection.query(`
      SELECT b.booking_id, b.booking_date, b.start_time, b.end_time,
             c.user_id AS customer_user_id,
             u.email AS customer_email, u.full_name AS customer_name,
             p.payment_status, s.service_name, b.service_id
      FROM bookings b
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      JOIN services s ON b.service_id = s.service_id
      WHERE b.status = 'pending'
        AND (
          CONCAT(b.booking_date, ' ', b.start_time) <= NOW()
          OR (b.booking_date = CURDATE() AND b.created_at <= DATE_SUB(NOW(), INTERVAL 2 HOUR))
          OR (b.booking_date > CURDATE() AND b.created_at <= DATE_SUB(NOW(), INTERVAL 4 HOUR))
        )
    `);

    for (const b of expired) {
      try {
        await connection.beginTransaction();

        await connection.query(
          "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?",
          [b.booking_id]
        );
        await connection.query(
          `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
           VALUES (?, NULL, 'pending', 'cancelled', 'Tự động hủy — hết thời gian chờ người nhận')`,
          [b.booking_id]
        );

        // Đánh dấu cần hoàn tiền nếu đã thanh toán
        if (b.payment_status === 'paid') {
          await connection.query(
            "UPDATE payments SET payment_status = 'refund_pending' WHERE booking_id = ?",
            [b.booking_id]
          );
        }

        await connection.commit();

        // Thông báo cho khách hàng
        const notifBody = b.payment_status === 'paid'
          ? `Đơn #${b.booking_id} (${b.service_name}) đã hủy tự động. Tiền sẽ được hoàn lại trong 1-3 ngày làm việc.`
          : `Đơn #${b.booking_id} (${b.service_name}) đã hủy tự động do không có người giúp việc nhận đơn.`;

        pushNotification({
          userId: b.customer_user_id,
          title: 'Đơn đặt lịch đã tự động hủy',
          body: notifBody,
          type: 'booking_cancelled',
          refId: b.booking_id,
        });
        emitToUser(b.customer_user_id, 'booking:update', {
          bookingId: b.booking_id, status: 'cancelled', reason: 'timeout',
        });

        if (b.customer_email) {
          mailIfOffline(b.customer_user_id, () =>
            sendCancelledEmail(b.customer_email, b.customer_name, {
              bookingId: b.booking_id, serviceName: b.service_name,
              bookingDate: b.booking_date, startTime: b.start_time,
            }, 'system')
          );
        }

        console.log(`⏰ Auto-cancelled booking #${b.booking_id}`);
      } catch (err) {
        await connection.rollback().catch(() => {});
        console.error(`Auto-cancel #${b.booking_id} error:`, err.message);
      }
    }
  } catch (err) {
    console.error('cancelExpiredBookings error:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

// Giai đoạn 2: Sau 10 phút không có ai nhận → re-broadcast với badge "Đang cần gấp"
async function escalateUrgentBookings() {
  try {
    const [urgents] = await pool.query(`
      SELECT b.booking_id, b.booking_date, b.start_time, b.end_time,
             b.service_id, s.service_name
      FROM bookings b
      JOIN services s ON b.service_id = s.service_id
      WHERE b.status = 'pending'
        AND b.timeout_notified = 0
        AND b.created_at <= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
        AND CONCAT(b.booking_date, ' ', b.start_time) > NOW()
    `);

    for (const b of urgents) {
      // Đánh dấu đã gửi phase-2 để không gửi lại
      await pool.query(
        'UPDATE bookings SET timeout_notified = 1 WHERE booking_id = ?',
        [b.booking_id]
      );

      const [helpers] = await pool.query(`
        SELECT DISTINCT u.user_id
        FROM helpers h
        JOIN users u ON h.user_id = u.user_id
        JOIN helper_services hs ON h.helper_id = hs.helper_id
        WHERE h.is_available = TRUE AND h.is_verified = TRUE AND hs.service_id = ?
      `, [b.service_id]);

      for (const h of helpers) {
        pushNotification({
          userId: h.user_id,
          title: '🔴 Đang cần gấp — Chưa có người nhận!',
          body: `${b.service_name} · ${b.booking_date} ${b.start_time}–${b.end_time}`,
          type: 'booking_new',
          refId: b.booking_id,
        });
        emitToUser(h.user_id, 'new_job', {
          bookingId: b.booking_id, svcName: b.service_name,
          bookingDate: b.booking_date, startTime: b.start_time, endTime: b.end_time,
          urgent: true,
        });
      }
    }
  } catch (err) {
    console.error('escalateUrgentBookings error:', err.message);
  }
}

function startBookingTimeoutJob() {
  const run = async () => {
    await cancelExpiredBookings();
    await escalateUrgentBookings();
  };

  run(); // Chạy ngay khi khởi động
  setInterval(run, 5 * 60 * 1000); // Sau đó cứ 5 phút chạy lại
  console.log('⏰ Booking timeout job đã khởi động (mỗi 5 phút)');
}

module.exports = { startBookingTimeoutJob };
