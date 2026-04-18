// Unit test BookingModel — mock toàn bộ MySQL pool/connection (Hướng B)
// Kiểm tra: logic transaction, ghi log, xử lý check-in/out, rollback khi lỗi

jest.mock('../src/config/database', () => ({
  pool: {
    getConnection: jest.fn(),
    query: jest.fn(),
  },
}));

const { pool } = require('../src/config/database');
const BookingModel = require('../src/models/booking.model');

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
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingModel.create', () => {
  const baseInput = {
    customerId: 1, helperId: 2, serviceId: 3, promoId: null,
    bookingDate: '2026-05-01', startTime: '08:00', endTime: '12:00',
    hours: 4, address: '123 ABC', basePrice: 200000, discountAmount: 0,
    totalPrice: 200000, note: null, paymentMethod: 'cash',
  };

  test('Tạo booking thành công: commit và trả về bookingId', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 99 }]) // INSERT bookings
      .mockResolvedValueOnce([{}])                // INSERT payments
      .mockResolvedValueOnce([{}]);               // INSERT booking_logs

    const result = await BookingModel.create(baseInput);

    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.rollback).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
    expect(result).toBe(99);
  });

  test('Ghi log trạng thái pending khi tạo booking', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await BookingModel.create(baseInput);

    // Query thứ 3 là INSERT booking_logs — kiểm tra có chứa 'pending'
    const logCall = mockConn.query.mock.calls[2];
    expect(logCall[0]).toContain('booking_logs');
    expect(logCall[0]).toContain('pending');
  });

  test('Tạo bản ghi payment cùng transaction', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await BookingModel.create(baseInput);

    const paymentCall = mockConn.query.mock.calls[1];
    expect(paymentCall[0]).toContain('payments');
    expect(paymentCall[1]).toContain(200000); // totalPrice
  });

  test('Có promoId → thực hiện thêm 2 query cập nhật khuyến mãi', async () => {
    mockConn.query
      .mockResolvedValue([{ insertId: 12 }]);

    await BookingModel.create({ ...baseInput, promoId: 5 });

    // bookings + payments + booking_logs + update promotions + insert promotion_usage = 5 queries
    expect(mockConn.query).toHaveBeenCalledTimes(5);
  });

  test('Rollback và ném lỗi khi INSERT thất bại', async () => {
    mockConn.query.mockRejectedValueOnce(new Error('DB error'));

    await expect(BookingModel.create(baseInput)).rejects.toThrow('DB error');

    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1); // release vẫn phải gọi
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingModel.updateStatus', () => {
  beforeEach(() => {
    // Query đầu: SELECT status hiện tại
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'pending' }]]) // SELECT current status
      .mockResolvedValueOnce([{}])                       // UPDATE bookings
      .mockResolvedValueOnce([{}]);                      // INSERT booking_logs
  });

  test('Chuyển pending → confirmed: commit thành công', async () => {
    await BookingModel.updateStatus(1, 'confirmed', 10, 'Helper xác nhận');

    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.rollback).not.toHaveBeenCalled();
  });

  test('Chuyển confirmed → in_progress: UPDATE phải có checkin_at', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'confirmed' }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await BookingModel.updateStatus(1, 'in_progress', 10);

    const updateCall = mockConn.query.mock.calls[1];
    expect(updateCall[0]).toContain('checkin_at');
    expect(updateCall[0]).not.toContain('checkout_at');
  });

  test('Chuyển in_progress → completed: UPDATE phải có checkout_at', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'in_progress' }]])
      .mockResolvedValueOnce([{}])  // UPDATE bookings
      .mockResolvedValueOnce([{}])  // INSERT booking_logs
      .mockResolvedValueOnce([{}])  // UPDATE helpers total_bookings
      .mockResolvedValueOnce([{}]); // UPDATE customers loyalty_points

    await BookingModel.updateStatus(1, 'completed', 10);

    const updateCall = mockConn.query.mock.calls[1];
    expect(updateCall[0]).toContain('checkout_at');
  });

  test('completed → tăng total_bookings của helper', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'in_progress' }]])
      .mockResolvedValue([{}]);

    await BookingModel.updateStatus(1, 'completed', 10);

    const helperUpdate = mockConn.query.mock.calls[3];
    expect(helperUpdate[0]).toContain('total_bookings');
    expect(helperUpdate[0]).toContain('total_bookings + 1');
  });

  test('completed → tăng loyalty_points của customer', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'in_progress' }]])
      .mockResolvedValue([{}]);

    await BookingModel.updateStatus(1, 'completed', 10);

    const customerUpdate = mockConn.query.mock.calls[4];
    expect(customerUpdate[0]).toContain('loyalty_points');
    expect(customerUpdate[0]).toContain('loyalty_points + 10');
  });

  test('Ghi log với old_status và new_status đúng', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'pending' }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await BookingModel.updateStatus(5, 'confirmed', 99, 'note test');

    const logCall = mockConn.query.mock.calls[2];
    expect(logCall[0]).toContain('booking_logs');
    // Params: [bookingId, changedByUserId, oldStatus, newStatus, note]
    expect(logCall[1]).toEqual([5, 99, 'pending', 'confirmed', 'note test']);
  });

  test('Rollback khi UPDATE thất bại', async () => {
    // Reset queue từ beforeEach để mock mới có hiệu lực
    mockConn.query.mockReset();
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'pending' }]])  // SELECT
      .mockRejectedValueOnce(new Error('UPDATE failed')); // UPDATE → lỗi

    await expect(BookingModel.updateStatus(1, 'confirmed', 10)).rejects.toThrow('UPDATE failed');

    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('Không thêm query tích điểm/booking khi trạng thái không phải completed', async () => {
    mockConn.query
      .mockResolvedValueOnce([[{ status: 'confirmed' }]])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await BookingModel.updateStatus(1, 'cancelled', 10);

    // Chỉ 3 queries: SELECT + UPDATE + INSERT log, không có query tích điểm
    expect(mockConn.query).toHaveBeenCalledTimes(3);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingModel.checkHelperConflict', () => {
  test('Trả về true khi có xung đột lịch', async () => {
    pool.query = jest.fn().mockResolvedValue([[{ booking_id: 1 }]]);

    const result = await BookingModel.checkHelperConflict(2, '2026-05-01', '08:00', '12:00');
    expect(result).toBe(true);
  });

  test('Trả về false khi không có xung đột', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    const result = await BookingModel.checkHelperConflict(2, '2026-05-01', '14:00', '16:00');
    expect(result).toBe(false);
  });

  test('Thêm điều kiện loại trừ excludeBookingId khi được truyền', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await BookingModel.checkHelperConflict(2, '2026-05-01', '08:00', '12:00', 10);

    const callArgs = pool.query.mock.calls[0];
    expect(callArgs[0]).toContain('booking_id !=');
    expect(callArgs[1]).toContain(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingModel.findByHelper', () => {
  test('Trả về danh sách booking của helper', async () => {
    const mockBookings = [{ booking_id: 3 }];
    pool.query = jest.fn().mockResolvedValue([mockBookings]);

    const result = await BookingModel.findByHelper(2);
    expect(result).toEqual(mockBookings);
  });

  test('Thêm điều kiện status khi được truyền', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await BookingModel.findByHelper(2, 'in_progress');

    const callArgs = pool.query.mock.calls[0];
    expect(callArgs[1]).toContain('in_progress');
    expect(callArgs[0]).toContain('b.status = ?');
  });

  test('Không thêm điều kiện status khi không truyền', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await BookingModel.findByHelper(2);

    const callArgs = pool.query.mock.calls[0];
    expect(callArgs[0]).not.toContain('b.status = ?');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingModel.findByCustomer', () => {
  test('Trả về danh sách booking của customer', async () => {
    const mockBookings = [{ booking_id: 1 }, { booking_id: 2 }];
    pool.query = jest.fn().mockResolvedValue([mockBookings]);

    const result = await BookingModel.findByCustomer(1);
    expect(result).toEqual(mockBookings);
  });

  test('Thêm điều kiện status khi được truyền', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await BookingModel.findByCustomer(1, 'pending');

    const callArgs = pool.query.mock.calls[0];
    expect(callArgs[1]).toContain('pending');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingModel.findById', () => {
  test('Trả về booking kèm logs khi tìm thấy', async () => {
    const mockBooking = [{ booking_id: 1, status: 'confirmed' }];
    const mockLogs = [{ log_id: 1, new_status: 'confirmed' }];
    pool.query = jest.fn()
      .mockResolvedValueOnce([mockBooking])
      .mockResolvedValueOnce([mockLogs]);

    const result = await BookingModel.findById(1);
    expect(result.booking_id).toBe(1);
    expect(result.logs).toEqual(mockLogs);
  });

  test('Trả về null khi không tìm thấy booking', async () => {
    pool.query = jest.fn()
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]]);

    const result = await BookingModel.findById(999);
    expect(result).toBeNull();
  });
});
