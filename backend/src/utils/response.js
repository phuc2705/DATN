// Chuẩn hóa cấu trúc response API - đảm bảo format nhất quán toàn hệ thống

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const deepCamel = (obj) => {
  if (Array.isArray(obj)) return obj.map(deepCamel);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), deepCamel(v)])
    );
  }
  return obj;
};

const sendSuccess = (res, data = null, message = 'Thành công', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data: deepCamel(data),
  });
};

const sendError = (res, message = 'Đã xảy ra lỗi', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { sendSuccess, sendError };
