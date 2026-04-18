// Unit test ReviewController — mock ReviewModel, UserModel, NotificationModel, pool
// Kiểm tra: tạo đánh giá, phân quyền, trạng thái booking, trùng review

jest.mock('../src/models/review.model');
jest.mock('../src/models/user.model');
jest.mock('../src/models/notification.model');
jest.mock('../src/config/database', () => ({ pool: { query: jest.fn() } }));

const ReviewModel = require('../src/models/review.model');
const UserModel = require('../src/models/user.model');
const NotificationModel = require('../src/models/notification.model');
const { pool } = require('../src/config/database');
const ReviewController = require('../src/controllers/review.controller');

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
describe('ReviewController.createReview', () => {
  const req = {
    user: { user_id: 2 },
    body: { bookingId: 5, rating: 5, comment: 'Tốt lắm!' },
  };

  const mockBookingRow = {
    booking_id: 5,
    helper_id: 3,
    status: 'completed',
    is_reviewed: false,
    helper_user_id: 7,
  };

  test('Tạo review thành công: trả về 201', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    pool.query.mockResolvedValueOnce([[mockBookingRow]]);
    ReviewModel.findByBooking.mockResolvedValue(null);
    ReviewModel.create.mockResolvedValue(20);
    NotificationModel.create.mockResolvedValue();

    const res = mockRes();
    await ReviewController.createReview(req, res, mockNext);

    expect(ReviewModel.create).toHaveBeenCalledWith(expect.objectContaining({ rating: 5 }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  test('Booking chưa completed: trả về 400', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    pool.query.mockResolvedValueOnce([[{ ...mockBookingRow, status: 'in_progress' }]]);

    const res = mockRes();
    await ReviewController.createReview(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(ReviewModel.create).not.toHaveBeenCalled();
  });

  test('Booking đã có is_reviewed=true: trả về 409', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    pool.query.mockResolvedValueOnce([[{ ...mockBookingRow, is_reviewed: true }]]);

    const res = mockRes();
    await ReviewController.createReview(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('ReviewModel.findByBooking đã có review: trả về 409', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    pool.query.mockResolvedValueOnce([[mockBookingRow]]);
    ReviewModel.findByBooking.mockResolvedValue({ review_id: 5 }); // đã review

    const res = mockRes();
    await ReviewController.createReview(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('Booking không thuộc về customer này: trả về 404', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    pool.query.mockResolvedValueOnce([[]]); // không tìm thấy booking khớp customer_id

    const res = mockRes();
    await ReviewController.createReview(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('Customer profile không tồn tại: trả về 404', async () => {
    UserModel.getCustomerProfile.mockResolvedValue(null);

    const res = mockRes();
    await ReviewController.createReview(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ReviewController.getHelperReviews', () => {
  test('Trả về danh sách review, tổng và phân phối sao', async () => {
    ReviewModel.findByHelper.mockResolvedValue([{ review_id: 1, rating: 5 }]);
    ReviewModel.countByHelper.mockResolvedValue(1);
    pool.query.mockResolvedValueOnce([[{ rating: 5, count: 1 }]]);

    const req = { params: { helperId: '3' }, query: {} };
    const res = mockRes();
    await ReviewController.getHelperReviews(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ total: 1 }),
    }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ReviewController.getMyReviews', () => {
  test('Trả về danh sách review của customer', async () => {
    UserModel.getCustomerProfile.mockResolvedValue({ customer_id: 10 });
    ReviewModel.findByCustomer.mockResolvedValue([{ review_id: 1, rating: 4 }]);

    const req = { user: { user_id: 2 } };
    const res = mockRes();
    await ReviewController.getMyReviews(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
  });

  test('Không tìm thấy customer profile: trả về 404', async () => {
    UserModel.getCustomerProfile.mockResolvedValue(null);

    const req = { user: { user_id: 999 } };
    const res = mockRes();
    await ReviewController.getMyReviews(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
