// Unit test PaymentModel — mock toàn bộ MySQL pool/connection và SettingModel
// Kiểm tra: confirmPayment (transaction + ví helper), findByBooking, findByCustomer,
//           findByHelper, findAll (bộ lọc), getTotalRevenue

jest.mock('../src/config/database', () => ({
  pool: {
    getConnection: jest.fn(),
    query: jest.fn(),
  },
}));

jest.mock('../src/models/setting.model', () => ({
  get: jest.fn(),
}));

const { pool } = require('../src/config/database');
const SettingModel = require('../src/models/setting.model');
const PaymentModel = require('../src/models/payment.model');

// ─── Mock connection dùng chung ───────────────────────────────────────────────
let mockConn;

beforeEach(() => {
  mockConn = {
    beginTransaction: jest.fn().mockResolvedValue(),
    query: jest.fn(),
    commit: jest.fn().mockResolvedValue(),
    rollback: jest.fn().mockResolvedValue(),
    release: jest.fn(),
  };
  pool.getConnection.mockResolvedValue(mockConn);
  jest.clearAllMocks();
  pool.getConnection.mockResolvedValue(mockConn);
  SettingModel.get.mockResolvedValue('0.20');
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentModel.confirmPayment', () => {
  test('Xác nhận thanh toán tiền mặt thành công: commit và release', async () => {
    // SettingModel.get trả về commission rate
    SettingModel.get.mockResolvedValue('0.20');

    // payment row
    mockConn.query
      .mockResolvedValueOnce([[{ amount: 200000, payment_method: 'cash', helper_user_id: 5 }]])  // SELECT payment
      .mockResolvedValueOnce([{}])   // UPDATE payments
      .mockResolvedValueOnce([{}])   // INSERT IGNORE wallets
      .mockResolvedValueOnce([[{ wallet_id: 1, balance: 50000 }]]) // SELECT wallet
      .mockResolvedValueOnce([{}])   // INSERT wallet_transactions (debit)
      .mockResolvedValueOnce([{}]);  // INSERT booking_logs

    await PaymentModel.confirmPayment(10, 99);

    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.rollback).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('Tiền mặt: tạo wallet_transactions loại debit (khấu trừ phí nền tảng)', async () => {
    SettingModel.get.mockResolvedValue('0.20');

    mockConn.query
      .mockResolvedValueOnce([[{ amount: 100000, payment_method: 'cash', helper_user_id: 5 }]])
      .mockResolvedValueOnce([{}])   // UPDATE payments
      .mockResolvedValueOnce([{}])   // INSERT IGNORE wallets
      .mockResolvedValueOnce([[{ wallet_id: 2, balance: 80000 }]])
      .mockResolvedValueOnce([{}])   // INSERT wallet_transactions
      .mockResolvedValueOnce([{}]);  // INSERT booking_logs

    await PaymentModel.confirmPayment(11, 1);

    // Query thứ 5 (index 4) là INSERT wallet_transactions — kiểm tra type = debit
    const walletTxCall = mockConn.query.mock.calls[4];
    expect(walletTxCall[0]).toContain('wallet_transactions');
    expect(walletTxCall[1]).toContain('debit');
  });

  test('Thanh toán online (vnpay): tạo wallet_transactions loại credit', async () => {
    SettingModel.get.mockResolvedValue('0.20');

    mockConn.query
      .mockResolvedValueOnce([[{ amount: 200000, payment_method: 'vnpay', helper_user_id: 5 }]])
      .mockResolvedValueOnce([{}])   // UPDATE payments
      .mockResolvedValueOnce([{}])   // INSERT IGNORE wallets
      .mockResolvedValueOnce([[{ wallet_id: 3, balance: 0 }]])
      .mockResolvedValueOnce([{}])   // INSERT wallet_transactions
      .mockResolvedValueOnce([{}]);  // INSERT booking_logs

    await PaymentModel.confirmPayment(12, 1);

    const walletTxCall = mockConn.query.mock.calls[4];
    expect(walletTxCall[0]).toContain('wallet_transactions');
    expect(walletTxCall[1]).toContain('credit');
    // helper_earning = 200000 - 40000 = 160000
    expect(walletTxCall[1]).toContain(160000);
  });

  test('commission_rate mặc định 0.20 khi setting trả về null', async () => {
    SettingModel.get.mockResolvedValue(null); // fallback 0.20

    mockConn.query
      .mockResolvedValueOnce([[{ amount: 100000, payment_method: 'cash', helper_user_id: 2 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([[{ wallet_id: 1, balance: 0 }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await PaymentModel.confirmPayment(13, 1);

    // UPDATE payments phải truyền commissionRate = 0.20
    const updatePayCall = mockConn.query.mock.calls[1];
    expect(updatePayCall[1]).toContain(0.20);
    // platform_fee_amount = 100000 * 0.20 = 20000
    expect(updatePayCall[1]).toContain(20000);
  });

  test('Không có helper (booking chưa gán): bỏ qua bước cập nhật ví', async () => {
    SettingModel.get.mockResolvedValue('0.20');

    mockConn.query
      .mockResolvedValueOnce([[{ amount: 50000, payment_method: 'cash', helper_user_id: null }]])
      .mockResolvedValueOnce([{}])   // UPDATE payments
      .mockResolvedValueOnce([{}]);  // INSERT booking_logs (paidByUserId đã có)

    await PaymentModel.confirmPayment(14, 5);

    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    // Không có query INSERT wallets hay INSERT wallet_transactions
    expect(mockConn.query).toHaveBeenCalledTimes(3);
  });

  test('paidByUserId null: tự lấy customer user_id từ booking', async () => {
    SettingModel.get.mockResolvedValue('0.20');

    mockConn.query
      .mockResolvedValueOnce([[{ amount: 100000, payment_method: 'cash', helper_user_id: null }]])
      .mockResolvedValueOnce([{}])   // UPDATE payments
      .mockResolvedValueOnce([[{ user_id: 7 }]])  // SELECT customer user_id
      .mockResolvedValueOnce([{}]);  // INSERT booking_logs

    await PaymentModel.confirmPayment(15, null);

    // Query index 2 phải là SELECT customer
    const customerQuery = mockConn.query.mock.calls[2];
    expect(customerQuery[0]).toContain('customers');
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
  });

  test('Rollback và ném lỗi khi query thất bại', async () => {
    SettingModel.get.mockResolvedValue('0.20');
    mockConn.query.mockRejectedValueOnce(new Error('DB failure'));

    await expect(PaymentModel.confirmPayment(99, 1)).rejects.toThrow('DB failure');

    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentModel.findByBooking', () => {
  test('Trả về đối tượng payment khi tìm thấy bookingId', async () => {
    const mockRow = { payment_id: 1, amount: 200000, payment_status: 'paid', customer_name: 'Test' };
    pool.query = jest.fn().mockResolvedValue([[mockRow]]);

    const result = await PaymentModel.findByBooking(1);

    expect(result).toEqual(mockRow);
    expect(pool.query.mock.calls[0][1]).toContain(1);
  });

  test('Trả về null khi không tìm thấy payment của booking', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    const result = await PaymentModel.findByBooking(999);

    expect(result).toBeNull();
  });

  test('Query JOIN đầy đủ các bảng liên quan', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findByBooking(5);

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain('payments');
    expect(sql).toContain('bookings');
    expect(sql).toContain('services');
    expect(sql).toContain('customers');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentModel.findByCustomer', () => {
  test('Trả về danh sách thanh toán của customer', async () => {
    const mockPayments = [
      { payment_id: 1, amount: 100000, payment_status: 'paid' },
      { payment_id: 2, amount: 200000, payment_status: 'pending' },
    ];
    pool.query = jest.fn().mockResolvedValue([mockPayments]);

    const result = await PaymentModel.findByCustomer(3);

    expect(result).toEqual(mockPayments);
    expect(result).toHaveLength(2);
  });

  test('Trả về mảng rỗng khi customer chưa có thanh toán nào', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    const result = await PaymentModel.findByCustomer(999);

    expect(result).toEqual([]);
  });

  test('Query lọc theo customer_id đúng', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findByCustomer(42);

    expect(pool.query.mock.calls[0][1]).toContain(42);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentModel.findByHelper', () => {
  test('Trả về thu nhập của helper chỉ gồm các đơn đã paid', async () => {
    const mockEarnings = [
      { payment_id: 1, helper_earning: 80000, payment_status: 'paid' },
    ];
    pool.query = jest.fn().mockResolvedValue([mockEarnings]);

    const result = await PaymentModel.findByHelper(2);

    expect(result).toEqual(mockEarnings);
  });

  test('Query phải có điều kiện payment_status = paid', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findByHelper(5);

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain("payment_status = 'paid'");
  });

  test('Query lọc theo helper_id đúng', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findByHelper(7);

    expect(pool.query.mock.calls[0][1]).toContain(7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentModel.findAll', () => {
  test('Không có filter: trả về tất cả giao dịch với limit/offset mặc định', async () => {
    const mockRows = [{ paymentId: 1 }, { paymentId: 2 }];
    pool.query = jest.fn().mockResolvedValue([mockRows]);

    const result = await PaymentModel.findAll({});

    expect(result).toEqual(mockRows);
    // Params cuối phải là limit=50, offset=0
    const params = pool.query.mock.calls[0][1];
    expect(params).toContain(50);
    expect(params).toContain(0);
  });

  test('Filter theo status: query phải chứa điều kiện payment_status', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findAll({ status: 'paid' });

    const sql = pool.query.mock.calls[0][0];
    const params = pool.query.mock.calls[0][1];
    expect(sql).toContain('payment_status = ?');
    expect(params).toContain('paid');
  });

  test('Filter theo startDate và endDate: query phải chứa cả hai điều kiện ngày', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findAll({ startDate: '2026-01-01', endDate: '2026-01-31' });

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain('DATE(p.created_at) >=');
    expect(sql).toContain('DATE(p.created_at) <=');
  });

  test('Truyền limit và offset tuỳ chỉnh: params phải chứa đúng giá trị', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await PaymentModel.findAll({ limit: 10, offset: 20 });

    const params = pool.query.mock.calls[0][1];
    expect(params).toContain(10);
    expect(params).toContain(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('PaymentModel.getTotalRevenue', () => {
  test('Trả về tổng doanh thu khi không có filter ngày', async () => {
    pool.query = jest.fn().mockResolvedValue([[{ totalRevenue: 5000000, platformRevenue: 1000000 }]]);

    const result = await PaymentModel.getTotalRevenue();

    expect(result.totalRevenue).toBe(5000000);
    expect(result.platformRevenue).toBe(1000000);
  });

  test('Truyền startDate và endDate: query chứa điều kiện lọc', async () => {
    pool.query = jest.fn().mockResolvedValue([[{ totalRevenue: 0, platformRevenue: 0 }]]);

    await PaymentModel.getTotalRevenue('2026-01-01', '2026-01-31');

    const sql = pool.query.mock.calls[0][0];
    const params = pool.query.mock.calls[0][1];
    expect(sql).toContain('DATE(paid_at) >=');
    expect(sql).toContain('DATE(paid_at) <=');
    expect(params).toContain('2026-01-01');
    expect(params).toContain('2026-01-31');
  });

  test("Query chỉ tính payment_status = 'paid'", async () => {
    pool.query = jest.fn().mockResolvedValue([[{ totalRevenue: 0, platformRevenue: 0 }]]);

    await PaymentModel.getTotalRevenue();

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain("payment_status = 'paid'");
  });
});
