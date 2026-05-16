// Unit test cho công thức Haversine — nền tảng của tính năng tìm helper gần vị trí
// Đây là thuật toán cốt lõi để lọc helper trong bán kính 5km
const { haversineDistance } = require('../src/utils/geocode');

describe('haversineDistance', () => {
  test('cùng một điểm → khoảng cách = 0', () => {
    expect(haversineDistance(21.0285, 105.8542, 21.0285, 105.8542)).toBe(0);
  });

  test('hai điểm gần nhau → khoảng cách xấp xỉ đúng', () => {
    // Dịch chuyển ~1.11km về phía bắc (0.01 độ vĩ độ ≈ 1.11km)
    const dist = haversineDistance(21.0000, 105.8500, 21.0100, 105.8500);
    expect(dist).toBeCloseTo(1.11, 1); // sai số ±0.05km
  });

  test('Hà Nội ↔ TP.HCM → khoảng cách ~1150-1200km', () => {
    // Hà Nội: 21.0285°N, 105.8542°E | TP.HCM: 10.8231°N, 106.6297°E
    const dist = haversineDistance(21.0285, 105.8542, 10.8231, 106.6297);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1250);
  });

  test('4.9km → trong bán kính 5km (helper được hiển thị)', () => {
    // ~0.044 độ vĩ độ ≈ 4.9km
    const dist = haversineDistance(21.0000, 105.8500, 21.0440, 105.8500);
    expect(dist).toBeLessThan(5);
  });

  test('5.5km → ngoài bán kính 5km (helper không hiển thị)', () => {
    // ~0.05 độ vĩ độ ≈ 5.56km
    const dist = haversineDistance(21.0000, 105.8500, 21.0500, 105.8500);
    expect(dist).toBeGreaterThan(5);
  });

  test('khoảng cách đối xứng: distance(A,B) === distance(B,A)', () => {
    const lat1 = 21.0285, lng1 = 105.8542;
    const lat2 = 10.8231, lng2 = 106.6297;
    expect(haversineDistance(lat1, lng1, lat2, lng2))
      .toBeCloseTo(haversineDistance(lat2, lng2, lat1, lng1), 5);
  });

  test('điểm ở kinh tuyến 0 và 180 (không bị lỗi số học)', () => {
    // Hai điểm đối diện nhau qua địa cực → bán chu vi Trái Đất ≈ 20015km
    const dist = haversineDistance(0, 0, 0, 180);
    expect(dist).toBeGreaterThan(19000);
    expect(dist).toBeLessThan(21000);
  });
});
