// Controller xác thực - đăng ký, đăng nhập, làm mới token
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendSuccess, sendError } = require('../utils/response');

const AuthController = {
  // Đăng ký tài khoản Khách hàng
  registerCustomer: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, address, district, city } = req.body;

      // Kiểm tra email đã tồn tại
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return sendError(res, 'Email đã được sử dụng.', 409);
      }

      // Mã hóa mật khẩu với bcrypt (salt round = 12)
      const passwordHash = await bcrypt.hash(password, 12);

      const userId = await UserModel.createCustomer({
        email, passwordHash, fullName, phone, address, district, city,
      });

      return sendSuccess(res, { userId }, 'Đăng ký thành công!', 201);
    } catch (error) {
      next(error);
    }
  },

  // Đăng ký tài khoản Người giúp việc
  registerHelper: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, dateOfBirth, gender, idCardNumber, address, hourlyRate, bio } = req.body;

      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return sendError(res, 'Email đã được sử dụng.', 409);
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const userId = await UserModel.createHelper({
        email, passwordHash, fullName, phone, dateOfBirth, gender,
        idCardNumber, address, hourlyRate, bio,
      });

      return sendSuccess(res, { userId }, 'Đăng ký thành công! Vui lòng chờ xác minh tài khoản.', 201);
    } catch (error) {
      next(error);
    }
  },

  // Đăng nhập - trả về access token và refresh token
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        return sendError(res, 'Email hoặc mật khẩu không đúng.', 401);
      }

      // So sánh mật khẩu với hash đã lưu
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return sendError(res, 'Email hoặc mật khẩu không đúng.', 401);
      }

      // Payload nhúng vào JWT (không nhúng dữ liệu nhạy cảm)
      const tokenPayload = {
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type,
      };

      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

      // Cập nhật last_seen
      await UserModel.updateLastSeen(user.user_id);

      return sendSuccess(res, {
        accessToken,
        refreshToken,
        user: {
          userId: user.user_id,
          email: user.email,
          fullName: user.full_name,
          userType: user.user_type,
          avatarUrl: user.avatar_url,
        },
      }, 'Đăng nhập thành công!');
    } catch (error) {
      next(error);
    }
  },

  // Làm mới Access Token bằng Refresh Token
  refreshToken: async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return sendError(res, 'Refresh token không được cung cấp.', 400);
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await UserModel.findById(decoded.user_id);
      if (!user) {
        return sendError(res, 'Người dùng không tồn tại.', 401);
      }

      const newAccessToken = generateAccessToken({
        user_id: user.user_id,
        email: user.email,
        user_type: user.user_type,
      });

      return sendSuccess(res, { accessToken: newAccessToken }, 'Làm mới token thành công!');
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return sendError(res, 'Refresh token đã hết hạn. Vui lòng đăng nhập lại.', 401);
      }
      next(error);
    }
  },

  // Lấy thông tin user hiện tại (từ token)
  getMe: async (req, res, next) => {
    try {
      const { user_id, user_type } = req.user;
      let profile;

      if (user_type === 'customer') {
        profile = await UserModel.getCustomerProfile(user_id);
      } else if (user_type === 'helper') {
        profile = await UserModel.getHelperProfile(user_id);
      } else {
        profile = await UserModel.findById(user_id);
      }

      if (!profile) return sendError(res, 'Không tìm thấy thông tin người dùng.', 404);

      await UserModel.updateLastSeen(user_id);
      return sendSuccess(res, profile);
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
