// Middleware xác thực JWT - bảo vệ tất cả API yêu cầu đăng nhập
const { verifyAccessToken } = require('../config/jwt');

// Xác thực token từ header Authorization: Bearer <token>
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Không tìm thấy token xác thực. Vui lòng đăng nhập.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Giải mã token và gắn thông tin user vào request
    const decoded = verifyAccessToken(token);
    req.user = decoded; // { user_id, email, user_type }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn. Vui lòng đăng nhập lại.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.',
    });
  }
};

// Middleware phân quyền - chỉ cho phép các role cụ thể truy cập
// Sử dụng: authorize('admin'), authorize('customer', 'helper')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.user_type)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này.',
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
