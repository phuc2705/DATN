// Controller quản lý dịch vụ và tìm kiếm người giúp việc
const ServiceModel = require('../models/service.model');
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

      const helpers = await ServiceModel.findHelpersByService(serviceId, city);
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
