// Model Booking - xử lý đặt lịch, check-in/out và lịch sử trạng thái
// Sử dụng Transaction cho toàn bộ luồng đặt lịch và thanh toán
const { pool } = require('../config/database');

const BookingModel = {
  // Tạo booking mới + bản ghi thanh toán + log trạng thái (1 transaction)
  create: async ({ customerId, helperId, serviceId, promoId, bookingDate, startTime, endTime,
                   hours, address, basePrice, discountAmount, totalPrice, note, paymentMethod }) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Tạo booking
      const [bookingResult] = await connection.query(
        `INSERT INTO bookings
         (customer_id, helper_id, service_id, promo_id, booking_date, start_time, end_time,
          hours, address, base_price, discount_amount, total_price, note)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customerId, helperId, serviceId, promoId || null, bookingDate, startTime, endTime,
         hours, address, basePrice, discountAmount, totalPrice, note || null]
      );
      const bookingId = bookingResult.insertId;

      // Trigger trg_create_payment_after_booking tự tạo payment với payment_method='cash'
      // Cập nhật đúng payment_method theo yêu cầu của khách hàng
      if (paymentMethod && paymentMethod !== 'cash') {
        await connection.query(
          'UPDATE payments SET payment_method = ? WHERE booking_id = ?',
          [paymentMethod, bookingId]
        );
      }

      // Ghi log trạng thái khởi tạo
      await connection.query(
        `INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note)
         VALUES (?, ?, NULL, 'pending', 'Booking được tạo')`,
        [bookingId, customerId] // changed_by là user_id của customer
      );

      // Cập nhật số lần sử dụng mã khuyến mãi nếu có
      if (promoId) {
        await connection.query(
          'UPDATE promotions SET used_count = used_count + 1 WHERE promo_id = ?',
          [promoId]
        );
        await connection.query(
          'INSERT INTO promotion_usage (promo_id, user_id, booking_id) SELECT ?, user_id, ? FROM customers WHERE customer_id = ?',
          [promoId, bookingId, customerId]
        );
      }

      await connection.commit();
      return bookingId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Cập nhật trạng thái booking + ghi log (luồng matching và check-in/out)
  updateStatus: async (bookingId, newStatus, changedByUserId, note = null) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Lấy trạng thái hiện tại để ghi vào log
      const [current] = await connection.query(
        'SELECT status FROM bookings WHERE booking_id = ?',
        [bookingId]
      );
      const oldStatus = current[0]?.status;

      // Cập nhật trạng thái booking
      let updateQuery = 'UPDATE bookings SET status = ? WHERE booking_id = ?';
      const updateParams = [newStatus, bookingId];

      // Ghi thêm timestamp check-in hoặc check-out
      if (newStatus === 'in_progress') {
        updateQuery = 'UPDATE bookings SET status = ?, checkin_at = NOW() WHERE booking_id = ?';
      } else if (newStatus === 'completed') {
        updateQuery = 'UPDATE bookings SET status = ?, checkout_at = NOW() WHERE booking_id = ?';
      }

      await connection.query(updateQuery, updateParams);

      // Ghi log thay đổi trạng thái
      await connection.query(
        'INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [bookingId, changedByUserId, oldStatus, newStatus, note]
      );

      // Khi hoàn thành: cập nhật total_bookings của helper và loyalty_points của customer
      if (newStatus === 'completed') {
        await connection.query(
          `UPDATE helpers h
           JOIN bookings b ON h.helper_id = b.helper_id
           SET h.total_bookings = h.total_bookings + 1
           WHERE b.booking_id = ?`,
          [bookingId]
        );
        // +10 điểm tích lũy cho mỗi đơn hoàn thành
        await connection.query(
          `UPDATE customers c
           JOIN bookings b ON c.customer_id = b.customer_id
           SET c.loyalty_points = c.loyalty_points + 10
           WHERE b.booking_id = ?`,
          [bookingId]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Lấy danh sách booking của customer
  findByCustomer: async (customerId, status = null) => {
    let query = `
      SELECT b.*, s.service_name, u.full_name AS helper_name, u.avatar_url AS helper_avatar,
             p.payment_status, p.payment_method
      FROM bookings b
      JOIN services s ON b.service_id = s.service_id
      LEFT JOIN helpers h ON b.helper_id = h.helper_id
      LEFT JOIN users u ON h.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.customer_id = ?
    `;
    const params = [customerId];
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    query += ' ORDER BY b.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Lấy danh sách booking của helper
  findByHelper: async (helperId, status = null) => {
    let query = `
      SELECT b.*, s.service_name, u.full_name AS customer_name, u.phone AS customer_phone
      FROM bookings b
      JOIN services s ON b.service_id = s.service_id
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE b.helper_id = ?
    `;
    const params = [helperId];
    if (status) { query += ' AND b.status = ?'; params.push(status); }
    query += ' ORDER BY b.booking_date ASC, b.start_time ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Lấy chi tiết 1 booking (kèm log lịch sử)
  findById: async (bookingId) => {
    const [bookingRows] = await pool.query(
      `SELECT b.*, s.service_name, s.base_price AS service_base_price,
              uc.user_id AS customer_user_id, uc.full_name AS customer_name, uc.phone AS customer_phone,
              uh.user_id AS helper_user_id, uh.full_name AS helper_name, uh.avatar_url AS helper_avatar, uh.phone AS helper_phone,
              p.payment_status, p.payment_method, p.paid_at
       FROM bookings b
       JOIN services s ON b.service_id = s.service_id
       JOIN customers c ON b.customer_id = c.customer_id
       JOIN users uc ON c.user_id = uc.user_id
       LEFT JOIN helpers h ON b.helper_id = h.helper_id
       LEFT JOIN users uh ON h.user_id = uh.user_id
       LEFT JOIN payments p ON b.booking_id = p.booking_id
       WHERE b.booking_id = ?`,
      [bookingId]
    );

    const [logRows] = await pool.query(
      `SELECT bl.*, u.full_name AS changed_by_name
       FROM booking_logs bl
       JOIN users u ON bl.changed_by = u.user_id
       WHERE bl.booking_id = ?
       ORDER BY bl.created_at ASC`,
      [bookingId]
    );

    return bookingRows[0] ? { ...bookingRows[0], logs: logRows } : null;
  },

  // Kiểm tra xung đột lịch của helper (tránh double booking)
  checkHelperConflict: async (helperId, bookingDate, startTime, endTime, excludeBookingId = null) => {
    let query = `
      SELECT booking_id FROM bookings
      WHERE helper_id = ?
        AND booking_date = ?
        AND status NOT IN ('cancelled')
        AND NOT (end_time <= ? OR start_time >= ?)
    `;
    const params = [helperId, bookingDate, startTime, endTime];
    if (excludeBookingId) { query += ' AND booking_id != ?'; params.push(excludeBookingId); }
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  },

  // Lấy danh sách booking đang chờ mà helper có thể nhận (open market + được yêu cầu đích danh)
  findAvailableJobsForHelper: async (helperId) => {
    const [rows] = await pool.query(`
      SELECT b.booking_id, b.booking_date, b.start_time, b.end_time, b.hours,
             b.address, b.total_price, b.note,
             (b.helper_id IS NOT NULL) AS is_requested,
             s.service_name,
             u.full_name AS customer_name
      FROM bookings b
      JOIN services s ON b.service_id = s.service_id
      JOIN customers c ON b.customer_id = c.customer_id
      JOIN users u ON c.user_id = u.user_id
      WHERE b.status = 'pending'
        AND (b.helper_id IS NULL OR b.helper_id = ?)
        AND NOT EXISTS (
          SELECT 1 FROM bookings b2
          WHERE b2.helper_id = ?
            AND b2.booking_date = b.booking_date
            AND b2.status NOT IN ('cancelled')
            AND NOT (b2.end_time <= b.start_time OR b2.start_time >= b.end_time)
        )
      ORDER BY b.booking_date ASC, b.start_time ASC
    `, [helperId, helperId]);
    return rows;
  },

  // Lấy danh sách helper đã từng phục vụ customer (để customer yêu cầu lại)
  findPreviousHelpers: async (customerId) => {
    const [rows] = await pool.query(`
      SELECT h.helper_id, u.full_name, u.avatar_url,
             h.rating_average, h.total_bookings, h.is_available, h.is_verified,
             MAX(b.booking_date) AS last_booking_date
      FROM bookings b
      JOIN helpers h ON b.helper_id = h.helper_id
      JOIN users u ON h.user_id = u.user_id
      WHERE b.customer_id = ? AND b.status = 'completed'
      GROUP BY h.helper_id, u.full_name, u.avatar_url,
               h.rating_average, h.total_bookings, h.is_available, h.is_verified
      ORDER BY last_booking_date DESC
    `, [customerId]);
    return rows;
  },

  // Gán helper vào booking và chuyển pending→confirmed (atomic, dùng FOR UPDATE tránh race condition)
  assignHelperAndConfirm: async (bookingId, helperId, changedByUserId) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [current] = await connection.query(
        'SELECT status, helper_id FROM bookings WHERE booking_id = ? FOR UPDATE',
        [bookingId]
      );
      if (!current[0] || current[0].status !== 'pending') {
        throw Object.assign(new Error('Booking không còn khả dụng để nhận.'), { statusCode: 409 });
      }
      if (current[0].helper_id !== null && current[0].helper_id !== helperId) {
        throw Object.assign(new Error('Booking đã được nhận bởi người giúp việc khác.'), { statusCode: 409 });
      }

      await connection.query(
        'UPDATE bookings SET helper_id = ?, status = ? WHERE booking_id = ?',
        [helperId, 'confirmed', bookingId]
      );
      await connection.query(
        'INSERT INTO booking_logs (booking_id, changed_by, old_status, new_status, note) VALUES (?, ?, ?, ?, ?)',
        [bookingId, changedByUserId, 'pending', 'confirmed', 'Helper nhận việc']
      );

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};

module.exports = BookingModel;
