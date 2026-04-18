// Unit test AuthController — mock UserModel, bcrypt, jwt config
// Kiểm tra: đăng ký, đăng nhập, refresh token, lấy thông tin user

jest.mock('../src/models/user.model');
jest.mock('bcryptjs');
jest.mock('../src/config/jwt');

const UserModel = require('../src/models/user.model');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../src/config/jwt');
const AuthController = require('../src/controllers/auth.controller');

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthController.registerCustomer', () => {
  const req = {
    body: {
      email: 'test@example.com', password: 'pass123', fullName: 'Test User',
      phone: '0901234567', address: '123 Phố', district: 'Hoàn Kiếm', city: 'Hà Nội',
    },
  };

  test('Đăng ký thành công: trả về 201 và userId', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_password');
    UserModel.createCustomer.mockResolvedValue(5);

    const res = mockRes();
    await AuthController.registerCustomer(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ userId: 5 }),
    }));
  });

  test('Email đã tồn tại: trả về 409', async () => {
    UserModel.findByEmail.mockResolvedValue({ user_id: 1, email: 'test@example.com' });

    const res = mockRes();
    await AuthController.registerCustomer(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(UserModel.createCustomer).not.toHaveBeenCalled();
  });

  test('Lỗi DB: gọi next(error)', async () => {
    const err = new Error('DB error');
    UserModel.findByEmail.mockRejectedValue(err);

    const res = mockRes();
    await AuthController.registerCustomer(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthController.registerHelper', () => {
  const req = {
    body: {
      email: 'helper@example.com', password: 'pass123', fullName: 'Helper Test',
      phone: '0901234567', dateOfBirth: '1990-01-01', gender: 'female',
      idCardNumber: '123456789', address: '456 Đường', hourlyRate: 50000, bio: 'Kinh nghiệm 5 năm',
    },
  };

  test('Đăng ký helper thành công: trả về 201', async () => {
    UserModel.findByEmail.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed_pass');
    UserModel.createHelper.mockResolvedValue(10);

    const res = mockRes();
    await AuthController.registerHelper(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('Email trùng: trả về 409', async () => {
    UserModel.findByEmail.mockResolvedValue({ user_id: 2 });

    const res = mockRes();
    await AuthController.registerHelper(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthController.login', () => {
  const mockUser = {
    user_id: 1, email: 'user@example.com', password_hash: 'hash',
    user_type: 'customer', full_name: 'Test', avatar_url: null,
  };

  test('Đăng nhập thành công: trả về accessToken và refreshToken', async () => {
    UserModel.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);
    generateAccessToken.mockReturnValue('access_token_abc');
    generateRefreshToken.mockReturnValue('refresh_token_xyz');
    UserModel.updateLastSeen.mockResolvedValue();

    const req = { body: { email: 'user@example.com', password: 'pass' } };
    const res = mockRes();
    await AuthController.login(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'access_token_abc' }),
    }));
  });

  test('Email không tồn tại: trả về 401', async () => {
    UserModel.findByEmail.mockResolvedValue(null);

    const req = { body: { email: 'noone@example.com', password: 'pass' } };
    const res = mockRes();
    await AuthController.login(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('Mật khẩu sai: trả về 401', async () => {
    UserModel.findByEmail.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { email: 'user@example.com', password: 'wrong' } };
    const res = mockRes();
    await AuthController.login(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthController.refreshToken', () => {
  test('Refresh thành công: trả về accessToken mới', async () => {
    verifyRefreshToken.mockReturnValue({ user_id: 1 });
    UserModel.findById.mockResolvedValue({ user_id: 1, email: 'a@b.com', user_type: 'customer' });
    generateAccessToken.mockReturnValue('new_access_token');

    const req = { body: { refreshToken: 'valid_refresh' } };
    const res = mockRes();
    await AuthController.refreshToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ accessToken: 'new_access_token' }),
    }));
  });

  test('Thiếu refreshToken: trả về 400', async () => {
    const req = { body: {} };
    const res = mockRes();
    await AuthController.refreshToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Token hết hạn: trả về 401', async () => {
    const err = new Error('expired');
    err.name = 'TokenExpiredError';
    verifyRefreshToken.mockImplementation(() => { throw err; });

    const req = { body: { refreshToken: 'expired_token' } };
    const res = mockRes();
    await AuthController.refreshToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AuthController.getMe', () => {
  test('Customer: trả về customer profile', async () => {
    const profile = { user_id: 1, customer_id: 10, full_name: 'Test' };
    UserModel.getCustomerProfile.mockResolvedValue(profile);
    UserModel.updateLastSeen.mockResolvedValue();

    const req = { user: { user_id: 1, user_type: 'customer' } };
    const res = mockRes();
    await AuthController.getMe(req, res, mockNext);

    expect(UserModel.getCustomerProfile).toHaveBeenCalledWith(1);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Helper: trả về helper profile', async () => {
    UserModel.getHelperProfile.mockResolvedValue({ user_id: 2, helper_id: 5 });
    UserModel.updateLastSeen.mockResolvedValue();

    const req = { user: { user_id: 2, user_type: 'helper' } };
    const res = mockRes();
    await AuthController.getMe(req, res, mockNext);

    expect(UserModel.getHelperProfile).toHaveBeenCalledWith(2);
  });

  test('Admin: dùng findById', async () => {
    UserModel.findById.mockResolvedValue({ user_id: 3, user_type: 'admin' });
    UserModel.updateLastSeen.mockResolvedValue();

    const req = { user: { user_id: 3, user_type: 'admin' } };
    const res = mockRes();
    await AuthController.getMe(req, res, mockNext);

    expect(UserModel.findById).toHaveBeenCalledWith(3);
  });

  test('Không tìm thấy user: trả về 404', async () => {
    UserModel.getCustomerProfile.mockResolvedValue(null);

    const req = { user: { user_id: 999, user_type: 'customer' } };
    const res = mockRes();
    await AuthController.getMe(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
