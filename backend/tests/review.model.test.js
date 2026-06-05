// Unit test ReviewModel — mock toàn bộ MySQL pool/connection
// Kiểm tra: create (transaction), findByHelper, countByHelper,
//           findByCustomer, findByBooking

jest.mock('../src/config/database', () => ({
  pool: {
    getConnection: jest.fn(),
    query: jest.fn(),
  },
}));

const { pool } = require('../src/config/database');
const ReviewModel = require('../src/models/review.model');

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
describe('ReviewModel.create', () => {
  const baseInput = {
    bookingId: 1,
    customerId: 2,
    helperId: 3,
    rating: 5,
    comment: 'Rất hài lòng',
  };

  test('Tạo review thành công: commit và trả về reviewId', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 42 }]) // INSERT reviews
      .mockResolvedValueOnce([{}])               // UPDATE helpers rating_average
      .mockResolvedValueOnce([{}]);              // UPDATE bookings is_reviewed

    const result = await ReviewModel.create(baseInput);

    expect(mockConn.beginTransaction).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.rollback).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
    expect(result).toBe(42);
  });

  test('INSERT reviews với đúng tham số (bookingId, customerId, helperId, rating, comment)', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await ReviewModel.create(baseInput);

    const insertCall = mockConn.query.mock.calls[0];
    expect(insertCall[0]).toContain('reviews');
    expect(insertCall[1]).toEqual([1, 2, 3, 5, 'Rất hài lòng']);
  });

  test('Cập nhật rating_average của helper theo helperId', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await ReviewModel.create(baseInput);

    const ratingUpdateCall = mockConn.query.mock.calls[1];
    expect(ratingUpdateCall[0]).toContain('rating_average');
    expect(ratingUpdateCall[0]).toContain('helpers');
    // Params: [helperId, helperId]
    expect(ratingUpdateCall[1]).toEqual([3, 3]);
  });

  test('Đánh dấu booking is_reviewed = TRUE sau khi tạo review', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 12 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    await ReviewModel.create(baseInput);

    const bookingUpdateCall = mockConn.query.mock.calls[2];
    expect(bookingUpdateCall[0]).toContain('is_reviewed');
    expect(bookingUpdateCall[0]).toContain('bookings');
    expect(bookingUpdateCall[1]).toContain(1); // bookingId
  });

  test('Thực hiện đúng 3 queries trong transaction', async () => {
    mockConn.query.mockResolvedValue([{ insertId: 5 }]);

    await ReviewModel.create(baseInput);

    expect(mockConn.query).toHaveBeenCalledTimes(3);
  });

  test('Rollback và ném lỗi khi INSERT reviews thất bại', async () => {
    mockConn.query.mockRejectedValueOnce(new Error('Duplicate entry'));

    await expect(ReviewModel.create(baseInput)).rejects.toThrow('Duplicate entry');

    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.commit).not.toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('Rollback và ném lỗi khi UPDATE helpers thất bại', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 13 }])
      .mockRejectedValueOnce(new Error('UPDATE error'));

    await expect(ReviewModel.create(baseInput)).rejects.toThrow('UPDATE error');

    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('Tạo review với comment null: vẫn thành công', async () => {
    mockConn.query
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([{}])
      .mockResolvedValueOnce([{}]);

    const result = await ReviewModel.create({ ...baseInput, comment: null });

    expect(result).toBe(20);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ReviewModel.findByHelper', () => {
  test('Trả về danh sách đánh giá của helper', async () => {
    const mockReviews = [
      { review_id: 1, rating: 5, comment: 'Tốt', customer_name: 'Nguyễn A' },
      { review_id: 2, rating: 4, comment: 'Ổn', customer_name: 'Trần B' },
    ];
    pool.query = jest.fn().mockResolvedValue([mockReviews]);

    const result = await ReviewModel.findByHelper(3);

    expect(result).toEqual(mockReviews);
    expect(result).toHaveLength(2);
  });

  test('Query lọc theo helperId đúng', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await ReviewModel.findByHelper(7);

    expect(pool.query.mock.calls[0][1]).toContain(7);
  });

  test('Truyền limit và offset tuỳ chỉnh: params phải chứa đúng giá trị', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await ReviewModel.findByHelper(3, 10, 5);

    const params = pool.query.mock.calls[0][1];
    expect(params).toContain(10); // limit
    expect(params).toContain(5);  // offset
  });

  test('Trả về mảng rỗng khi helper chưa có đánh giá nào', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    const result = await ReviewModel.findByHelper(999);

    expect(result).toEqual([]);
  });

  test('Query JOIN đầy đủ bảng customers, users, bookings, services', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await ReviewModel.findByHelper(1);

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain('customers');
    expect(sql).toContain('users');
    expect(sql).toContain('bookings');
    expect(sql).toContain('services');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ReviewModel.countByHelper', () => {
  test('Trả về số lượng review của helper', async () => {
    pool.query = jest.fn().mockResolvedValue([[{ total: 15 }]]);

    const result = await ReviewModel.countByHelper(3);

    expect(result).toBe(15);
  });

  test('Trả về 0 khi helper chưa có review', async () => {
    pool.query = jest.fn().mockResolvedValue([[{ total: 0 }]]);

    const result = await ReviewModel.countByHelper(999);

    expect(result).toBe(0);
  });

  test('Query COUNT đúng theo helperId', async () => {
    pool.query = jest.fn().mockResolvedValue([[{ total: 5 }]]);

    await ReviewModel.countByHelper(4);

    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain('COUNT(*)');
    expect(pool.query.mock.calls[0][1]).toContain(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ReviewModel.findByCustomer', () => {
  test('Trả về danh sách đánh giá mà customer đã viết', async () => {
    const mockReviews = [
      { review_id: 1, rating: 5, helper_name: 'Helper X' },
    ];
    pool.query = jest.fn().mockResolvedValue([mockReviews]);

    const result = await ReviewModel.findByCustomer(2);

    expect(result).toEqual(mockReviews);
  });

  test('Query lọc theo customerId đúng', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await ReviewModel.findByCustomer(9);

    expect(pool.query.mock.calls[0][1]).toContain(9);
  });

  test('Trả về mảng rỗng khi customer chưa viết đánh giá nào', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    const result = await ReviewModel.findByCustomer(888);

    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ReviewModel.findByBooking', () => {
  test('Trả về review khi booking đã được đánh giá', async () => {
    const mockReview = { review_id: 5 };
    pool.query = jest.fn().mockResolvedValue([[mockReview]]);

    const result = await ReviewModel.findByBooking(1);

    expect(result).toEqual(mockReview);
  });

  test('Trả về null khi booking chưa được đánh giá', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    const result = await ReviewModel.findByBooking(999);

    expect(result).toBeNull();
  });

  test('Query lọc theo bookingId đúng', async () => {
    pool.query = jest.fn().mockResolvedValue([[]]);

    await ReviewModel.findByBooking(7);

    expect(pool.query.mock.calls[0][1]).toContain(7);
    const sql = pool.query.mock.calls[0][0];
    expect(sql).toContain('reviews');
    expect(sql).toContain('booking_id = ?');
  });
});
