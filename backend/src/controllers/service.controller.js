// Controller quản lý dịch vụ và tìm kiếm người giúp việc
const ServiceModel = require('../models/service.model');
const { pool } = require('../config/database');
const { sendSuccess, sendError } = require('../utils/response');

const ServiceController = {
  // Lấy tất cả dịch vụ (public - không cần đăng nhập)
  getAllServices: async (req, res, next) => {
    try {
      const services = await ServiceModel.findAll();
      return sendSuccess(res, services);
    } catch (error) {
      next(error);
    }
  },

  // Lấy chi tiết 1 dịch vụ theo ID (public)
  getServiceById: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const service = await ServiceModel.findById(serviceId);
      if (!service) return sendError(res, 'Dịch vụ không tồn tại.', 404);
      return sendSuccess(res, service);
    } catch (error) {
      next(error);
    }
  },

  // Tìm kiếm helper theo dịch vụ + thành phố
  searchHelpers: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const { city } = req.query;

      const service = await ServiceModel.findById(serviceId);
      if (!service) return sendError(res, 'Dịch vụ không tồn tại.', 404);

      const rawHelpers = await ServiceModel.findHelpersByService(serviceId, city);
      const helpers = rawHelpers.map((h) => ({
        userId:          h.user_id,
        helperId:        h.helper_id,
        fullName:        h.full_name,
        avatarUrl:       h.avatar_url,
        lastSeenAt:      h.last_seen_at,
        ratingAverage:   Number(h.rating_average) || 0,
        totalBookings:   h.total_bookings || 0,
        experienceYears: h.experience_years || 0,
        isVerified:      h.is_verified,
        isAvailable:     h.is_available,
        bio:             h.bio,
        effectivePrice:  Number(h.effective_price) || 0,
        experienceLevel: h.experience_level,
      }));
      return sendSuccess(res, { service, helpers });
    } catch (error) {
      next(error);
    }
  },

  // Lấy lịch làm việc của helper
  getHelperSchedule: async (req, res, next) => {
    try {
      const { helperId } = req.params;
      const schedule = await ServiceModel.getHelperSchedule(helperId);
      return sendSuccess(res, schedule);
    } catch (error) {
      next(error);
    }
  },

  // Admin: tạo dịch vụ mới
  createService: async (req, res, next) => {
    try {
      const { serviceName, description, basePrice, iconUrl, slug } = req.body;
      const serviceId = await ServiceModel.create({ serviceName, description, basePrice, iconUrl, slug });
      return sendSuccess(res, { serviceId }, 'Tạo dịch vụ thành công!', 201);
    } catch (error) {
      next(error);
    }
  },

  // Lấy đánh giá của dịch vụ (lọc theo service_id qua bảng bookings)
  getServiceReviews: async (req, res, next) => {
    try {
      const { serviceId } = req.params;
      const [rows] = await pool.query(
        `SELECT r.review_id, r.rating, r.comment, r.created_at,
                uc.full_name AS customer_name, uc.avatar_url AS customer_avatar,
                uh.full_name AS helper_name, uh.avatar_url AS helper_avatar
         FROM reviews r
         JOIN bookings b ON r.booking_id = b.booking_id
         JOIN customers c ON r.customer_id = c.customer_id
         JOIN users uc ON c.user_id = uc.user_id
         JOIN helpers h ON r.helper_id = h.helper_id
         JOIN users uh ON h.user_id = uh.user_id
         WHERE b.service_id = ? AND r.is_visible = 1
         ORDER BY r.created_at DESC
         LIMIT 50`,
        [serviceId]
      );
      return sendSuccess(res, rows);
    } catch (error) {
      next(error);
    }
  },

  // Helper đăng ký cung cấp dịch vụ
  registerHelperService: async (req, res, next) => {
    try {
      const { helperId } = req.params;
      const { serviceId, experienceLevel, customPrice } = req.body;
      await ServiceModel.addHelperService(helperId, serviceId, experienceLevel, customPrice);
      return sendSuccess(res, null, 'Đăng ký dịch vụ thành công!', 201);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ServiceController;
