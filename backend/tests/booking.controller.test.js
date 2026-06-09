// Unit test BookingController — mock BookingModel, UserModel, pool, pricing
// Kiểm tra: luồng điều phối, phân quyền, tính giá tập trung, xử lý lỗi

jest.mock('../src/models/booking.model');
jest.mock('../src/models/user.model');
jest.mock('../src/config/database', () => ({
  pool: {
    query: jest.fn(),
    getConnection: jest.fn(),
  },
}));
jest.mock('../src/utils/pricing', () => ({
  calculateBookingPrice: jest.fn(),
  // getEffectiveRate: dùng custom_price nếu có, ngược lại dùng baseRate
  getEffectiveRate: jest.fn((baseRate, customPrice) => customPrice || baseRate),
}));
// customerTrust không mock bởi test cũ → trả về requiresOnlinePayment=true cho khách mới → chặn 403
jest.mock('../src/utils/customerTrust', () => ({
  getCustomerTrustInfo: jest.fn().mockResolvedValue({
    requiresOnlinePayment: false,
    isNewCustomer: false,
    completionRatePercent: 100,
    totalBookings: 5,
  }),
}));

const BookingModel = require('../src/models/booking.model');
const UserModel = require('../src/models/user.model');
const { pool } = require('../src/config/database');
const { calculateBookingPrice, getEffectiveRate } = require('../src/utils/pricing');
const { getCustomerTrustInfo } = require('../src/utils/customerTrust');
const BookingController = require('../src/controllers/booking.controller');

// ─── Helper tạo mock req/res ──────────────────────────────────────────────────
const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => {
  // resetAllMocks xóa cả queue mockResolvedValueOnce, tránh rò rỉ mock giữa các test
  jest.resetAllMocks();
  // Sau resetAllMocks phải thiết lập lại customerTrust (mặc định: không yêu cầu online payment)
  getCustomerTrustInfo.mockResolvedValue({
    requiresOnlinePayment: false,
    isNewCustomer: false,
    completionRatePercent: 100,
    totalBookings: 5,
  });
  // checkCustomerConflict mặc định không có xung đột
  BookingModel.checkCustomerConflict.mockResolvedValue(false);
  // checkHelperConflict mặc định không có xung đột
  BookingModel.checkHelperConflict.mockResolvedValue(false);
  // getEffectiveRate bị reset bởi resetAllMocks → phải restore lại
  getEffectiveRate.mockImplementation((baseRate, customPrice) => customPrice || baseRate);
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.createBooking', () => {
  const baseReq = {
    user: { user_id: 1, user_type: 'customer' },
    body: {
      helperId: 2, serviceId: 3, bookingDate: '2027-06-01',
      startTime: '08:00', endTime: '12:00',
      address: '123 ABC', paymentMethod: 'cash',
    },
  };

  test('Tạo booking thành công: trả về 201 và bookingId', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query.mockResolvedValue([[{ effective_rate: '50000', is_verified: true, is_available: true }]]);
    BookingModel.checkHelperConflict.mockResolvedValue(false);
    calculateBookingPrice.mockReturnValue({ hours: 4, basePrice: 200000, discountAmount: 0, totalPrice: 200000 });
    BookingModel.create.mockResolvedValue(99);

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ bookingId: 99 }),
    }));
  });

  test('Giá được tính tại Backend — không dùng giá từ request', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query
      .mockResolvedValueOnce([[{ service_id: 3, base_price: '50000' }]])                                              // service query
      .mockResolvedValueOnce([[{ cnt: 1 }]])                                                                          // prevCheck: customer đã từng làm với helper này
      .mockResolvedValueOnce([[{ helper_id: 2, is_verified: true, is_available: true, custom_price: null }]])         // helper query
      .mockResolvedValueOnce([[{ cnt: 5 }]]);                                                                         // available helpers count
    calculateBookingPrice.mockReturnValue({ hours: 4, basePrice: 200000, discountAmount: 0, totalPrice: 200000 });
    BookingModel.create.mockResolvedValue(1);

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    // calculateBookingPrice phải được gọi với dữ liệu từ DB (base_price), không từ body
    expect(calculateBookingPrice).toHaveBeenCalledWith('08:00', '12:00', 50000, null);
  });

  test('Trả về 404 khi không tìm thấy customer', async () => {
    UserModel.getCustomerProfile.mockResolvedValue(null);

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Trả về 400 khi helper không cung cấp dịch vụ', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query.mockResolvedValue([[]]); // Không tìm thấy helper+service

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Trả về 400 khi helper chưa được xác minh', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query.mockResolvedValue([[{ effective_rate: '50000', is_verified: false, is_available: true }]]);

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(BookingModel.create).not.toHaveBeenCalled();
  });

  test('Trả về 400 khi helper không nhận việc (is_available = false)', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query.mockResolvedValue([[{ effective_rate: '50000', is_verified: true, is_available: false }]]);

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(BookingModel.create).not.toHaveBeenCalled();
  });

  test('Trả về 409 khi helper đã có lịch trùng giờ', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query.mockResolvedValue([[{ effective_rate: '50000', is_verified: true, is_available: true }]]);
    BookingModel.checkHelperConflict.mockResolvedValue(true); // Có xung đột

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(BookingModel.create).not.toHaveBeenCalled();
  });

  test('Trả về 400 khi mã khuyến mãi không hợp lệ', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query
      .mockResolvedValueOnce([[{ service_id: 3, base_price: '50000' }]])                                            // service query
      .mockResolvedValueOnce([[{ cnt: 1 }]])                                                                        // prevCheck
      .mockResolvedValueOnce([[{ helper_id: 2, is_verified: true, is_available: true, custom_price: null }]])       // helper query
      .mockResolvedValueOnce([[]])                                                                                   // promo query → không tìm thấy

    const res = mockRes();
    await BookingController.createBooking(
      { ...baseReq, body: { ...baseReq.body, promoCode: 'INVALID' } },
      res, mockNext
    );

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('Trả về 400 khi user đã dùng hết lượt mã khuyến mãi', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query
      .mockResolvedValueOnce([[{ effective_rate: '50000', is_verified: true, is_available: true }]])    // helper query
      .mockResolvedValueOnce([[{ promo_id: 1, max_uses_per_user: 1, code: 'SALE10',
                                  discount_type: 'percentage', discount_value: 10,
                                  max_discount: null, min_order_value: 0 }]]) // promo tìm thấy
      .mockResolvedValueOnce([[{ cnt: 1 }]]);                    // usage đã đạt max
    BookingModel.checkHelperConflict.mockResolvedValue(false);

    const res = mockRes();
    await BookingController.createBooking(
      { ...baseReq, body: { ...baseReq.body, promoCode: 'SALE10' } },
      res, mockNext
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(BookingModel.create).not.toHaveBeenCalled();
  });

  test('Áp dụng promo hợp lệ: calculateBookingPrice nhận promo object', async () => {
    const promo = { promo_id: 2, max_uses_per_user: 3, code: 'SALE20',
                    discount_type: 'percentage', discount_value: 20,
                    max_discount: 50000, min_order_value: 0 };
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10, preferred_payment: 'cash' });
    pool.query
      .mockResolvedValueOnce([[{ service_id: 3, base_price: '50000' }]])                                          // service query
      .mockResolvedValueOnce([[{ cnt: 1 }]])                                                                      // prevCheck
      .mockResolvedValueOnce([[{ helper_id: 2, is_verified: true, is_available: true, custom_price: null }]])     // helper query
      .mockResolvedValueOnce([[promo]])                                                                           // promo query
      .mockResolvedValueOnce([[{ cnt: 0 }]])                                                                     // usage query
      .mockResolvedValueOnce([[{ cnt: 5 }]])                                                                     // available helpers count
      .mockResolvedValue([[]]);                                                                                   // customer email lookup + background queries
    calculateBookingPrice.mockReturnValue({ hours: 4, basePrice: 200000, discountAmount: 40000, totalPrice: 160000 });
    BookingModel.create.mockResolvedValue(5);

    const res = mockRes();
    await BookingController.createBooking(
      { ...baseReq, body: { ...baseReq.body, promoCode: 'SALE20' } },
      res, mockNext
    );

    expect(calculateBookingPrice).toHaveBeenCalledWith('08:00', '12:00', 50000, promo);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Gọi next(error) khi có lỗi không mong đợi', async () => {
    UserModel.getCustomerProfile.mockRejectedValue(new Error('DB down'));

    const res = mockRes();
    await BookingController.createBooking(baseReq, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.confirmBooking (pending → confirmed)', () => {
  test('Helper xác nhận đơn thành công', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 1, helper_id: 7, status: 'pending' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]); // helper lookup
    BookingModel.updateStatus.mockResolvedValue();

    const req = { params: { bookingId: '1' }, user: { user_id: 5 } };
    const res = mockRes();
    await BookingController.confirmBooking(req, res, mockNext);

    expect(BookingModel.updateStatus).toHaveBeenCalledWith('1', 'confirmed', 5, 'Helper xác nhận nhận đơn');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 404 khi booking không tồn tại', async () => {
    BookingModel.findById.mockResolvedValue(null);

    const req = { params: { bookingId: '99' }, user: { user_id: 5 } };
    const res = mockRes();
    await BookingController.confirmBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Trả về 403 khi helper khác cố confirm đơn không phải của mình', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 1, helper_id: 7, status: 'pending' });
    pool.query.mockResolvedValue([[{ helper_id: 99 }]]); // helper_id khác

    const req = { params: { bookingId: '1' }, user: { user_id: 5 } };
    const res = mockRes();
    await BookingController.confirmBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(BookingModel.updateStatus).not.toHaveBeenCalled();
  });

  test('Trả về 422 khi trạng thái không hợp lệ (cancelled → confirmed)', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 1, helper_id: 7, status: 'cancelled' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);

    const req = { params: { bookingId: '1' }, user: { user_id: 5 } };
    const res = mockRes();
    await BookingController.confirmBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
    expect(BookingModel.updateStatus).not.toHaveBeenCalled();
  });

  test('Trả về 422 khi cố confirm đơn đã hoàn thành', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 1, helper_id: 7, status: 'completed' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);

    const req = { params: { bookingId: '1' }, user: { user_id: 5 } };
    const res = mockRes();
    await BookingController.confirmBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('Gọi next(error) khi updateStatus ném lỗi DB', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 1, helper_id: 7, status: 'pending' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);
    BookingModel.updateStatus.mockRejectedValue(new Error('lỗi DB'));

    const req = { params: { bookingId: '1' }, user: { user_id: 5 } };
    const res = mockRes();
    await BookingController.confirmBooking(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.checkIn (confirmed → in_progress)', () => {
  test('Helper check-in thành công', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 2, helper_id: 7, status: 'confirmed' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);
    BookingModel.updateStatus.mockResolvedValue();

    const req = { params: { bookingId: '2' }, user: { user_id: 6 }, body: {} };
    const res = mockRes();
    await BookingController.checkIn(req, res, mockNext);

    expect(BookingModel.updateStatus).toHaveBeenCalledWith('2', 'in_progress', 6, 'Helper đã check-in', null);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 422 khi checkin đơn chưa được confirm (pending)', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 2, helper_id: 7, status: 'pending' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);

    const req = { params: { bookingId: '2' }, user: { user_id: 6 } };
    const res = mockRes();
    await BookingController.checkIn(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('Trả về 403 khi helper khác cố check-in', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 2, helper_id: 7, status: 'confirmed' });
    pool.query.mockResolvedValue([[{ helper_id: 999 }]]);

    const req = { params: { bookingId: '2' }, user: { user_id: 6 } };
    const res = mockRes();
    await BookingController.checkIn(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.checkOut (in_progress → completed)', () => {
  test('Helper check-out thành công', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 3, helper_id: 7, status: 'in_progress' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);
    BookingModel.updateStatus.mockResolvedValue();

    const req = { params: { bookingId: '3' }, user: { user_id: 6 }, body: {} };
    const res = mockRes();
    await BookingController.checkOut(req, res, mockNext);

    expect(BookingModel.updateStatus).toHaveBeenCalledWith('3', 'completed', 6, expect.any(String), null);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 422 khi checkout đơn chưa checkin (confirmed)', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 3, helper_id: 7, status: 'confirmed' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);

    const req = { params: { bookingId: '3' }, user: { user_id: 6 } };
    const res = mockRes();
    await BookingController.checkOut(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('Trả về 422 khi checkout đơn đã hoàn thành', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 3, helper_id: 7, status: 'completed' });
    pool.query.mockResolvedValue([[{ helper_id: 7 }]]);

    const req = { params: { bookingId: '3' }, user: { user_id: 6 } };
    const res = mockRes();
    await BookingController.checkOut(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('Trả về 403 khi helper khác cố check-out', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 3, helper_id: 7, status: 'in_progress' });
    pool.query.mockResolvedValue([[{ helper_id: 888 }]]);

    const req = { params: { bookingId: '3' }, user: { user_id: 6 } };
    const res = mockRes();
    await BookingController.checkOut(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.cancelBooking', () => {
  // cancelBooking dùng pool.getConnection() + conn.query() trực tiếp (không qua BookingModel.updateStatus)
  const mockCancelConn = () => {
    const conn = {
      beginTransaction: jest.fn().mockResolvedValue(),
      query: jest.fn()
        .mockResolvedValueOnce([{}])                        // UPDATE bookings SET status = 'cancelled'
        .mockResolvedValueOnce([{}])                        // INSERT booking_logs
        .mockResolvedValueOnce([[{ payment_status: 'unpaid', deposit_amount: null }]])  // SELECT payment
        .mockResolvedValue([{}]),                           // các query phụ (hoàn tiền v.v.)
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
      release: jest.fn(),
    };
    pool.getConnection.mockResolvedValue(conn);
    return conn;
  };

  test('Customer hủy đơn của chính mình thành công', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 4, customer_id: 10, status: 'pending' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    mockCancelConn();

    const req = { params: { bookingId: '4' }, user: { user_id: 1, user_type: 'customer' }, body: {} };
    const res = mockRes();
    await BookingController.cancelBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Hủy booking với lý do tùy chỉnh', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 4, customer_id: 10, status: 'pending' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    const conn = mockCancelConn();

    const req = { params: { bookingId: '4' }, user: { user_id: 1, user_type: 'customer' }, body: { reason: 'Bận đột xuất' } };
    const res = mockRes();
    await BookingController.cancelBooking(req, res, mockNext);

    // Kiểm tra lý do hủy được ghi vào booking_logs (query thứ 2, param thứ 4)
    const logParams = conn.query.mock.calls[1][1];
    expect(logParams[3]).toBe('Bận đột xuất');
  });

  test('Admin hủy bất kỳ booking nào không cần check ownership', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 5, customer_id: 99, status: 'confirmed' });
    mockCancelConn();

    const req = { params: { bookingId: '5' }, user: { user_id: 1, user_type: 'admin' }, body: {} };
    const res = mockRes();
    await BookingController.cancelBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 403 khi customer cố hủy đơn của người khác', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 4, customer_id: 55, status: 'pending' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 }); // customer_id khác

    const req = { params: { bookingId: '4' }, user: { user_id: 1, user_type: 'customer' }, body: {} };
    const res = mockRes();
    await BookingController.cancelBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(BookingModel.updateStatus).not.toHaveBeenCalled();
  });

  test('Trả về 422 khi hủy đơn đã hoàn thành', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 4, customer_id: 10, status: 'completed' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });

    const req = { params: { bookingId: '4' }, user: { user_id: 1, user_type: 'customer' }, body: {} };
    const res = mockRes();
    await BookingController.cancelBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });

  test('Trả về 422 khi hủy đơn đang in_progress', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 4, customer_id: 10, status: 'in_progress' });
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });

    const req = { params: { bookingId: '4' }, user: { user_id: 1, user_type: 'customer' }, body: {} };
    const res = mockRes();
    await BookingController.cancelBooking(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(422);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.getMyBookingsAsCustomer', () => {
  test('Trả về danh sách booking của customer', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    BookingModel.findByCustomer.mockResolvedValue([{ booking_id: 1 }, { booking_id: 2 }]);

    const req = { user: { user_id: 1 }, query: {} };
    const res = mockRes();
    await BookingController.getMyBookingsAsCustomer(req, res, mockNext);

    expect(BookingModel.findByCustomer).toHaveBeenCalledWith(10, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 404 khi customer không tồn tại', async () => {
    UserModel.getCustomerProfile.mockResolvedValue(null);

    const req = { user: { user_id: 99 }, query: {} };
    const res = mockRes();
    await BookingController.getMyBookingsAsCustomer(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.getMyBookingsAsHelper', () => {
  test('Trả về danh sách công việc của helper', async () => {
    pool.query.mockResolvedValue([[{ helper_id: 5 }]]);
    BookingModel.findByHelper.mockResolvedValue([{ booking_id: 3 }]);

    const req = { user: { user_id: 2 }, query: {} };
    const res = mockRes();
    await BookingController.getMyBookingsAsHelper(req, res, mockNext);

    expect(BookingModel.findByHelper).toHaveBeenCalledWith(5, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 404 khi helper không tồn tại', async () => {
    pool.query.mockResolvedValue([[]]); // Không tìm thấy helper

    const req = { user: { user_id: 99 }, query: {} };
    const res = mockRes();
    await BookingController.getMyBookingsAsHelper(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('BookingController.getBookingDetail', () => {
  test('Trả về chi tiết booking khi tìm thấy', async () => {
    BookingModel.findById.mockResolvedValue({ booking_id: 1, status: 'confirmed', logs: [] });
    // Controller query review count để kiểm tra đã review chưa
    pool.query.mockResolvedValueOnce([[{ cnt: 0 }]]);

    const req = { params: { bookingId: '1' }, user: { user_id: 1, user_type: 'customer' } };
    const res = mockRes();
    await BookingController.getBookingDetail(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Trả về 404 khi booking không tồn tại', async () => {
    BookingModel.findById.mockResolvedValue(null);

    const req = { params: { bookingId: '999' }, user: { user_id: 1, user_type: 'customer' } };
    const res = mockRes();
    await BookingController.getBookingDetail(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
