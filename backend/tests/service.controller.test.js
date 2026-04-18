// Unit test ServiceController — mock ServiceModel
// Kiểm tra: lấy dịch vụ, tìm helper, lịch làm việc, tạo dịch vụ

jest.mock('../src/models/service.model');

const ServiceModel = require('../src/models/service.model');
const ServiceController = require('../src/controllers/service.controller');

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
describe('ServiceController.getAllServices', () => {
  test('Trả về danh sách dịch vụ', async () => {
    ServiceModel.findAll.mockResolvedValue([
      { service_id: 1, service_name: 'Dọn dẹp nhà cửa' },
      { service_id: 2, service_name: 'Giặt ủi' },
    ]);

    const req = {};
    const res = mockRes();
    await ServiceController.getAllServices(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test('Lỗi DB: gọi next(error)', async () => {
    const err = new Error('DB error');
    ServiceModel.findAll.mockRejectedValue(err);

    const req = {};
    const res = mockRes();
    await ServiceController.getAllServices(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledWith(err);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ServiceController.searchHelpers', () => {
  test('Trả về danh sách helpers theo dịch vụ', async () => {
    ServiceModel.findById.mockResolvedValue({ service_id: 1, service_name: 'Dọn dẹp' });
    ServiceModel.findHelpersByService.mockResolvedValue([
      { helper_id: 1, full_name: 'Nguyễn Thị A' },
    ]);

    const req = { params: { serviceId: '1' }, query: { city: 'Hà Nội' } };
    const res = mockRes();
    await ServiceController.searchHelpers(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ helpers: expect.any(Array) }),
    }));
  });

  test('Dịch vụ không tồn tại: trả về 404', async () => {
    ServiceModel.findById.mockResolvedValue(null);

    const req = { params: { serviceId: '999' }, query: {} };
    const res = mockRes();
    await ServiceController.searchHelpers(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(ServiceModel.findHelpersByService).not.toHaveBeenCalled();
  });

  test('Không có helpers phù hợp: trả về mảng rỗng', async () => {
    ServiceModel.findById.mockResolvedValue({ service_id: 2, service_name: 'Nấu ăn' });
    ServiceModel.findHelpersByService.mockResolvedValue([]);

    const req = { params: { serviceId: '2' }, query: { city: 'Đà Nẵng' } };
    const res = mockRes();
    await ServiceController.searchHelpers(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ helpers: [] }),
    }));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ServiceController.getHelperSchedule', () => {
  test('Trả về lịch làm việc của helper', async () => {
    ServiceModel.getHelperSchedule.mockResolvedValue([
      { day_of_week: 'monday', start_time: '08:00', end_time: '17:00' },
    ]);

    const req = { params: { helperId: '3' } };
    const res = mockRes();
    await ServiceController.getHelperSchedule(req, res, mockNext);

    expect(ServiceModel.getHelperSchedule).toHaveBeenCalledWith('3');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('ServiceController.createService', () => {
  test('Admin tạo dịch vụ mới: trả về 201', async () => {
    ServiceModel.create.mockResolvedValue(7);

    const req = {
      body: { serviceName: 'Chăm sóc thú cưng', description: 'Tắm rửa, chải lông', basePrice: 60000, slug: 'cham-soc-thu-cung' },
    };
    const res = mockRes();
    await ServiceController.createService(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ serviceId: 7 }),
    }));
  });
});
