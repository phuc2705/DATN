// Controller xác thực - đăng ký (kèm OTP xác minh email), đăng nhập, làm mới token
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const OtpModel = require('../models/otp.model');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { sendSuccess, sendError } = require('../utils/response');
const { sendOtpEmail } = require('../utils/email');
const { geocodeAddress } = require('../utils/geocode');
const { pool } = require('../config/database');

// Sinh mã OTP 6 chữ số ngẫu nhiên
const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// Kiểm tra email có nằm trong danh sách test không (từ biến môi trường TEST_EMAILS)
const isTestEmail = (email) => {
  const list = (process.env.TEST_EMAILS || '').split(',').map(e => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
};

const AuthController = {
  // Đăng ký Khách hàng: lưu DB ngay (is_active=0) rồi gửi OTP xác minh email
  registerCustomer: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, address, district, city } = req.body;

      // Kiểm tra email đã tồn tại và đã kích hoạt
      const existing = await UserModel.findByEmailAny(email);
      if (existing && existing.is_active) {
        // Email test được phép đăng ký lại dù đã active (xóa tài khoản cũ)
        if (isTestEmail(email)) {
          await UserModel.deleteByEmail(email);
        } else {
          return sendError(res, 'Email đã được sử dụng.', 409);
        }
      }

      // Nếu đã đăng ký nhưng chưa xác minh → xóa tài khoản cũ để đăng ký lại
      if (existing && !existing.is_active) {
        await UserModel.deleteInactiveByEmail(email);
      }

      // Hash mật khẩu do người dùng tự tạo
      const passwordHash = await bcrypt.hash(password, 12);

      // Tạo tài khoản trong DB với is_active = 0 (chưa kích hoạt)
      await UserModel.createCustomer({
        email, passwordHash, fullName, phone, address, district, city,
      });

      // Sinh OTP và gửi qua Gmail
      const otpCode = generateOtp();
      await OtpModel.create({ email, otpCode });
      await sendOtpEmail(email, otpCode, fullName);

      return sendSuccess(
        res,
        { email },
        'Tài khoản đã được tạo. Mã OTP đã gửi đến email của bạn, vui lòng xác minh.',
        200
      );
    } catch (error) {
      next(error);
    }
  },

  // Đăng ký Người giúp việc: lưu DB ngay (is_active=0) rồi gửi OTP xác minh email
  registerHelper: async (req, res, next) => {
    try {
      const { email, password, fullName, phone, dateOfBirth, gender, idCardNumber, address, bio } = req.body;

      // serviceIds gửi lên dưới dạng chuỗi JSON hoặc mảng
      let serviceIds = [];
      try {
        const raw = req.body.serviceIds;
        serviceIds = Array.isArray(raw) ? raw : JSON.parse(raw || '[]');
      } catch { serviceIds = []; }

      const avatarUrl = req.file
        ? `/uploads/avatars/${req.file.filename}`
        : '/avatars/helper-1.svg';

      const existing = await UserModel.findByEmailAny(email);
      if (existing && existing.is_active) {
        // Email test được phép đăng ký lại dù đã active (xóa tài khoản cũ)
        if (isTestEmail(email)) {
          await UserModel.deleteByEmail(email);
        } else {
          return sendError(res, 'Email đã được sử dụng.', 409);
        }
      }

      if (existing && !existing.is_active) {
        await UserModel.deleteInactiveByEmail(email);
      }

      const passwordHash = await bcrypt.hash(password, 12);

      await UserModel.createHelper({
        email, passwordHash, fullName, phone, dateOfBirth, gender,
        idCardNumber, address, bio, avatarUrl, pendingServiceIds: serviceIds,
      });

      // Email test: kích hoạt ngay, bỏ qua OTP, tự duyệt helper + gán dịch vụ, lên lịch tự xóa
      if (isTestEmail(email)) {
        await UserModel.activateUser(email);

        // Tự động verify helper và chuyển pending_service_ids → helper_services (bỏ qua admin)
        const [[helperRow]] = await pool.query(
          'SELECT helper_id FROM helpers WHERE user_id = (SELECT user_id FROM users WHERE email = ?)',
          [email]
        );
        if (helperRow?.helper_id) {
          await UserModel.adminVerifyHelper(helperRow.helper_id);
        }

        const delayMs = (parseInt(process.env.TEST_CLEANUP_MINUTES) || 30) * 60 * 1000;
        setTimeout(async () => {
          try { await UserModel.deleteByEmail(email); } catch { /* đã bị xóa trước đó */ }
        }, delayMs);
        return sendSuccess(res, { email, skipOtp: true },
          '[TEST] Tài khoản đã được kích hoạt và duyệt tự động. Không cần xác minh OTP.', 200);
      }

      const otpCode = generateOtp();
      await OtpModel.create({ email, otpCode });
      await sendOtpEmail(email, otpCode, fullName);

      return sendSuccess(
        res,
        { email },
        'Tài khoản đã được tạo. Mã OTP đã gửi đến email của bạn, vui lòng xác minh.',
        200
      );
    } catch (error) {
      next(error);
    }
  },

  // Xác minh OTP → kích hoạt tài khoản (is_active = 1)
  verifyOtp: async (req, res, next) => {
    try {
      const { email, otp } = req.body;

      const record = await OtpModel.findByEmail(email);
      if (!record) {
        return sendError(res, 'Mã OTP không tồn tại hoặc đã được sử dụng.', 400);
      }

      // Kiểm tra OTP hết hạn (5 phút) → xóa tài khoản chưa kích hoạt để buộc đăng ký lại
      if (new Date() > new Date(record.expires_at)) {
        await UserModel.deleteInactiveByEmail(email);
        return sendError(res, 'Mã OTP đã hết hạn. Tài khoản đã bị xóa, vui lòng đăng ký lại.', 400);
      }

      // So khớp mã OTP
      if (record.otp_code !== String(otp)) {
        return sendError(res, 'Mã OTP không đúng.', 400);
      }

      // Đánh dấu OTP đã dùng (chống replay attack)
      await OtpModel.markUsed(record.id);

      // Kích hoạt tài khoản trong DB
      await UserModel.activateUser(email);

      // Email test → tự động xóa tài khoản sau TEST_CLEANUP_MINUTES phút
      if (isTestEmail(email)) {
        const delayMs = (parseInt(process.env.TEST_CLEANUP_MINUTES) || 30) * 60 * 1000;
        setTimeout(async () => {
          try { await UserModel.deleteByEmail(email); } catch { /* đã bị xóa trước đó */ }
        }, delayMs);
      }

      // Lấy thông tin user sau khi kích hoạt
      const activatedUser = await UserModel.findByEmailAny(email);

      // Geocode địa chỉ helper bất đồng bộ để lưu tọa độ cho tính năng lọc gần đây
      if (activatedUser?.user_type === 'helper') {
        pool.query('SELECT address FROM helpers WHERE user_id = ?', [activatedUser.user_id])
          .then(async ([rows]) => {
            if (!rows[0]?.address) return;
            const coords = await geocodeAddress(rows[0].address);
            if (coords) {
              await pool.query(
                'UPDATE helpers SET latitude = ?, longitude = ? WHERE user_id = ?',
                [coords.lat, coords.lng, activatedUser.user_id]
              );
            }
          }).catch(() => {});
      }

      // Kiểm tra loại tài khoản để trả về thông báo phù hợp
      const message = activatedUser?.user_type === 'helper'
        ? 'Xác minh email thành công! Vui lòng chờ Admin xét duyệt tài khoản (1–2 ngày làm việc).'
        : 'Xác minh email thành công! Bạn có thể đăng nhập ngay.';

      return sendSuccess(res, { userType: activatedUser?.user_type }, message, 200);
    } catch (error) {
      next(error);
    }
  },

  // Gửi lại OTP mới khi OTP cũ hết hạn
  resendOtp: async (req, res, next) => {
    try {
      const { email } = req.body;

      // Chỉ gửi lại nếu tài khoản tồn tại nhưng chưa kích hoạt
      const user = await UserModel.findByEmailAny(email);
      if (!user) {
        return sendError(res, 'Email không tồn tại trong hệ thống. Vui lòng đăng ký lại.', 400);
      }
      if (user.is_active) {
        return sendError(res, 'Tài khoản đã được xác minh.', 400);
      }

      const otpCode = generateOtp();
      await OtpModel.create({ email, otpCode });
      await sendOtpEmail(email, otpCode, user.full_name);

      return sendSuccess(res, { email }, 'Mã OTP mới đã được gửi đến email của bạn.', 200);
    } catch (error) {
      next(error);
    }
  },

  // Đăng nhập - chỉ cho phép tài khoản đã xác minh (is_active = 1)
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // findByEmail chỉ tìm is_active = 1, nên tự động chặn tài khoản chưa xác minh
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Kiểm tra xem email có tồn tại nhưng chưa xác minh không
        const unverified = await UserModel.findByEmailAny(email);
        if (unverified && !unverified.is_active) {
          return sendError(res, 'Email chưa được xác minh. Vui lòng kiểm tra hộp thư và nhập mã OTP.', 403);
        }
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

  // Đăng nhập bằng Firebase OAuth (Google/Facebook) — xác minh ID token, tạo user nếu chưa có
  firebaseLogin: async (req, res, next) => {
    try {
      const { idToken } = req.body;
      if (!idToken) return sendError(res, 'ID token không được cung cấp.', 400);

      const admin = require('../config/firebase-admin');
      const decoded = await admin.auth().verifyIdToken(idToken);
      const { email, name: fullName, picture: avatarUrl } = decoded;

      if (!email) return sendError(res, 'Tài khoản OAuth không có email.', 400);

      const user = await UserModel.findOrCreateOAuthCustomer({ email, fullName, avatarUrl });

      const tokenPayload = { user_id: user.user_id, email: user.email, user_type: user.user_type };
      const accessToken = generateAccessToken(tokenPayload);
      const refreshToken = generateRefreshToken(tokenPayload);

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
      if (error.code?.startsWith('auth/')) {
        return sendError(res, 'Token xác thực không hợp lệ hoặc đã hết hạn.', 401);
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
