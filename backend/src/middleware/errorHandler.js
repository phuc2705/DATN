// Middleware xử lý lỗi toàn cục - bắt tất cả lỗi không được xử lý cục bộ
const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // Lỗi validation từ express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors: err.errors,
    });
  }

  // Lỗi trùng lặp dữ liệu MySQL (email/phone đã tồn tại)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại trong hệ thống.',
    });
  }

  // Lỗi khóa ngoại MySQL
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu tham chiếu không tồn tại.',
    });
  }

  // Lỗi mặc định - không để lộ thông tin nhạy cảm ở production
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Lỗi máy chủ nội bộ.'
      : err.message || 'Đã xảy ra lỗi không xác định.';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

// Middleware bắt route không tồn tại (404)
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy route: ${req.method} ${req.path}`,
  });
};

module.exports = { errorHandler, notFound };
