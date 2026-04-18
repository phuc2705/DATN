// Unit test PaymentController — mock PaymentModel, UserModel, NotificationModel, pool
// Kiểm tra: xác nhận thanh toán, lịch sử, phân quyền

jest.mock('../src/models/payment.model');
jest.mock('../src/models/user.model');
jest.mock('../src/models/notification.model');
jest.mock('../src/config/database', () => ({ pool: { query: jest.fn() } }));

const PaymentModel = require('../src/models/payment.model');
const UserModel = require('../src/models/user.model');
const NotificationModel = require('../src/models/notification.model');
const { pool } = require('../src/config/database');
const PaymentController = require('../src/controllers/payment.controller');

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
describe('PaymentController.confirmPayment', () => {
  test('Customer xác nhận thanh toán thành công', async () => {
    PaymentModel.findByBooking.mockResolvedValue({ payment_id: 1, payment_status: 'pending' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    // pool.query: lần 1 kiểm tra quyền, lần 2 lấy thông tin helper
    pool.query
      .mockResolvedValueOnce([[{ customer_id: 10 }]])
      .mockResolvedValueOnce([[{ helper_user_id: 3, total_price: 200000 }]]);
    PaymentModel.confirmPayment.mockResolvedValue();
    NotificationModel.create.mockResolvedValue();

    const req = { user: { user_id: 2, user_type: 'customer' }, params: { bookingId: '5' } };
    const res = mockRes();
    await PaymentController.confirmPayment(req, res, mockNext);

    expect(PaymentModel.confirmPayment).toHaveBeenCalledWith('5', 2);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Admin xác nhận thanh toán: bỏ qua kiểm tra customer_id', async () => {
    PaymentModel.findByBooking.mockResolvedValue({ payment_status: 'pending' });
    pool.query.mockResolvedValueOnce([[{ helper_user_id: 3, total_price: 100000 }]]);
    PaymentModel.confirmPayment.mockResolvedValue();
    NotificationModel.create.mockResolvedValue();

    const req = { user: { user_id: 1, user_type: 'admin' }, params: { bookingId: '5' } };
    const res = mockRes();
    await PaymentController.confirmPayment(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(UserModel.getCustomerProfile).not.toHaveBeenCalled();
  });

  test('Không tìm thấy payment: trả về 404', async () => {
    PaymentModel.findByBooking.mockResolvedValue(null);

    const req = { user: { user_id: 1, user_type: 'customer' }, params: { bookingId: '99' } };
    const res = mockRes();
    await PaymentController.confirmPayment(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Đã thanh toán rồi: trả về 409', async () => {
    PaymentModel.findByBooking.mockResolvedValue({ payment_status: 'paid' });

    const req = { user: { user_id: 1, user_type: 'customer' }, params: { bookingId: '5' } };
    const res = mockRes();
    await PaymentController.confirmPayment(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('Customer thanh toán booking của người khác: trả về 403', async () => {
    PaymentModel.findByBooking.mockResolvedValue({ payment_status: 'pending' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    pool.query.mockResolvedValueOnce([[{ customer_id: 99 }]]); // không phải customer 10

    const req = { user: { user_id: 2, user_type: 'customer' }, params: { bookingId: '5' } };
    const res = mockRes();
    await PaymentController.confirmPayment(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentController.getMyPayments', () => {
  test('Trả về danh sách thanh toán và tổng chi tiêu', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    PaymentModel.findByCustomer.mockResolvedValue([
      { payment_status: 'paid', amount: '200000' },
      { payment_status: 'paid', amount: '150000' },
      { payment_status: 'pending', amount: '100000' },
    ]);

    const req = { user: { user_id: 2 } };
    const res = mockRes();
    await PaymentController.getMyPayments(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ totalSpent: 350000 }),
    }));
  });

  test('Không tìm thấy customer profile: trả về 404', async () => {
    UserModel.getCustomerProfile.mockResolvedValue(null);

    const req = { user: { user_id: 999 } };
    const res = mockRes();
    await PaymentController.getMyPayments(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentController.getHelperEarnings', () => {
  test('Trả về thu nhập helper', async () => {
    pool.query.mockResolvedValueOnce([[{ helper_id: 3 }]]);
    PaymentModel.findByHelper.mockResolvedValue([
      { amount: '300000' },
      { amount: '200000' },
    ]);

    const req = { user: { user_id: 5 } };
    const res = mockRes();
    await PaymentController.getHelperEarnings(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ totalEarned: 500000 }),
    }));
  });

  test('Helper chưa có profile: trả về 404', async () => {
    pool.query.mockResolvedValueOnce([[]]); // không tìm thấy helper

    const req = { user: { user_id: 999 } };
    const res = mockRes();
    await PaymentController.getHelperEarnings(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
