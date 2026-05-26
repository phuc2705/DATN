// Controller phản hồi hệ thống — báo lỗi, khiếu nại, góp ý từ customer & helper
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const CATEGORY_LABEL = {
  bug:                  'Lỗi ứng dụng',
  complaint_helper:     'Khiếu nại về người giúp việc',
  complaint_customer:   'Khiếu nại về khách hàng',
  payment_issue:        'Vấn đề thanh toán',
  suggestion:           'Góp ý cải thiện',
  other:                'Khác',
};

const FeedbackController = {
  // POST /api/feedback — Gửi phản hồi (customer hoặc helper)
  create: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { category, subject, description, bookingId } = req.body;

      if (!category || !subject?.trim() || !description?.trim()) {
        return sendError(res, 'Vui lòng điền đầy đủ thông tin phản hồi.', 400);
      }

      // Nếu gắn với booking, kiểm tra user có quyền truy cập booking đó không
      if (bookingId) {
        const [[bk]] = await pool.query(
          `SELECT b.booking_id FROM bookings b
           LEFT JOIN customers c ON b.customer_id = c.customer_id
           LEFT JOIN helpers h ON b.helper_id = h.helper_id
           WHERE b.booking_id = ? AND (c.user_id = ? OR h.user_id = ?)`,
          [bookingId, user_id, user_id]
        );
        if (!bk) return sendError(res, 'Không tìm thấy đơn hàng liên quan.', 404);
      }

      const [result] = await pool.query(
        `INSERT INTO system_feedbacks (user_id, category, subject, description, booking_id)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, category, subject.trim(), description.trim(), bookingId || null]
      );

      return sendSuccess(res, { feedbackId: result.insertId },
        'Cảm ơn phản hồi của bạn! Chúng tôi sẽ xem xét và phản hồi sớm nhất có thể.', 201);
    } catch (error) {
      next(error);
    }
  },

  // GET /api/feedback/my — Lịch sử phản hồi của người dùng hiện tại
  getMy: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const [rows] = await pool.query(
        `SELECT f.feedback_id, f.category, f.subject, f.description, f.status,
                f.admin_note, f.booking_id, f.created_at, f.resolved_at
         FROM system_feedbacks f
         WHERE f.user_id = ?
         ORDER BY f.created_at DESC`,
        [user_id]
      );
      return sendSuccess(res, rows.map(r => ({
        feedbackId:  r.feedback_id,
        category:    r.category,
        categoryLabel: CATEGORY_LABEL[r.category] || r.category,
        subject:     r.subject,
        description: r.description,
        status:      r.status,
        adminNote:   r.admin_note,
        bookingId:   r.booking_id,
        createdAt:   r.created_at,
        resolvedAt:  r.resolved_at,
      })));
    } catch (error) {
      next(error);
    }
  },

  // ─── Admin endpoints ─────────────────────────────────────────────────────────

  // GET /api/admin/feedbacks — Danh sách phản hồi (admin)
  adminList: async (req, res, next) => {
    try {
      const { status, category, page = 1, limit = 20 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      let where = '1=1';
      const params = [];
      if (status)   { where += ' AND f.status = ?';   params.push(status); }
      if (category) { where += ' AND f.category = ?'; params.push(category); }

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(*) AS total FROM system_feedbacks f WHERE ${where}`, params
      );

      const [rows] = await pool.query(
        `SELECT f.*, u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone,
                ru.full_name AS resolver_name
         FROM system_feedbacks f
         JOIN users u ON f.user_id = u.user_id
         LEFT JOIN users ru ON f.resolved_by = ru.user_id
         WHERE ${where}
         ORDER BY
           CASE f.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
           f.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      return sendSuccess(res, {
        feedbacks: rows.map(r => ({
          feedbackId:    r.feedback_id,
          userId:        r.user_id,
          userName:      r.user_name,
          userEmail:     r.user_email,
          userPhone:     r.user_phone,
          category:      r.category,
          categoryLabel: CATEGORY_LABEL[r.category] || r.category,
          subject:       r.subject,
          description:   r.description,
          bookingId:     r.booking_id,
          status:        r.status,
          adminNote:     r.admin_note,
          resolverName:  r.resolver_name,
          createdAt:     r.created_at,
          resolvedAt:    r.resolved_at,
        })),
        total: Number(total),
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/admin/feedbacks/:feedbackId — Cập nhật trạng thái + ghi chú (admin)
  adminUpdate: async (req, res, next) => {
    try {
      const { user_id } = req.user;
      const { feedbackId } = req.params;
      const { status, adminNote } = req.body;

      const VALID_STATUS = ['open', 'in_progress', 'resolved', 'closed'];
      if (status && !VALID_STATUS.includes(status)) {
        return sendError(res, 'Trạng thái không hợp lệ.', 400);
      }

      const [[fb]] = await pool.query(
        'SELECT feedback_id FROM system_feedbacks WHERE feedback_id = ?', [feedbackId]
      );
      if (!fb) return sendError(res, 'Không tìm thấy phản hồi.', 404);

      const updates = [];
      const vals = [];
      if (status) {
        updates.push('status = ?');
        vals.push(status);
        if (status === 'resolved' || status === 'closed') {
          updates.push('resolved_by = ?', 'resolved_at = NOW()');
          vals.push(user_id);
        }
      }
      if (adminNote !== undefined) { updates.push('admin_note = ?'); vals.push(adminNote); }

      if (updates.length === 0) return sendError(res, 'Không có thay đổi nào.', 400);

      vals.push(feedbackId);
      await pool.query(`UPDATE system_feedbacks SET ${updates.join(', ')} WHERE feedback_id = ?`, vals);

      return sendSuccess(res, null, 'Đã cập nhật phản hồi.');
    } catch (error) {
      next(error);
    }
  },
};

module.exports = FeedbackController;
