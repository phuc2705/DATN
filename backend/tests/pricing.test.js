// Unit test cho logic tính giá - yêu cầu coverage >= 90%
const { calculateHours, calculateBasePrice, calculateDiscount, calculateBookingPrice } = require('../src/utils/pricing');

describe('calculateHours', () => {
  test('Tính giờ cơ bản 8:00 -> 12:00 = 4 giờ', () => {
    expect(calculateHours('08:00', '12:00')).toBe(4);
  });

  test('Tính giờ có phút lẻ 09:00 -> 11:30 = 2.5 giờ', () => {
    expect(calculateHours('09:00', '11:30')).toBe(2.5);
  });

  test('Tính giờ qua buổi trưa 07:00 -> 17:00 = 10 giờ', () => {
    expect(calculateHours('07:00', '17:00')).toBe(10);
  });

  test('Ném lỗi nếu end_time trước start_time', () => {
    expect(() => calculateHours('12:00', '08:00')).toThrow('Giờ kết thúc phải sau giờ bắt đầu');
  });

  test('Ném lỗi nếu start_time = end_time', () => {
    expect(() => calculateHours('10:00', '10:00')).toThrow('Giờ kết thúc phải sau giờ bắt đầu');
  });
});

describe('calculateBasePrice', () => {
  test('2 giờ x 50,000đ/h = 100,000đ', () => {
    expect(calculateBasePrice(2, 50000)).toBe(100000);
  });

  test('2.5 giờ x 80,000đ/h = 200,000đ', () => {
    expect(calculateBasePrice(2.5, 80000)).toBe(200000);
  });

  test('Làm tròn đến 2 chữ số thập phân', () => {
    expect(calculateBasePrice(1.5, 33333)).toBe(49999.5);
  });
});

describe('calculateDiscount', () => {
  const promoPercentage = {
    discount_type: 'percentage',
    discount_value: 20,
    min_order_value: 50000,
    max_discount: null,
  };

  const promoFixed = {
    discount_type: 'fixed',
    discount_value: 30000,
    min_order_value: 0,
    max_discount: null,
  };

  test('Giảm 20% trên đơn 200,000đ = 40,000đ', () => {
    expect(calculateDiscount(200000, promoPercentage)).toBe(40000);
  });

  test('Không giảm nếu đơn thấp hơn min_order_value', () => {
    expect(calculateDiscount(30000, promoPercentage)).toBe(0);
  });

  test('Giảm cố định 30,000đ', () => {
    expect(calculateDiscount(200000, promoFixed)).toBe(30000);
  });

  test('Giảm cố định không vượt quá giá gốc', () => {
    const bigPromo = { discount_type: 'fixed', discount_value: 500000, min_order_value: 0, max_discount: null };
    expect(calculateDiscount(100000, bigPromo)).toBe(100000);
  });

  test('Giảm % với giới hạn max_discount', () => {
    const cappedPromo = { ...promoPercentage, max_discount: 20000 };
    expect(calculateDiscount(200000, cappedPromo)).toBe(20000); // 40000 > max 20000
  });

  test('Trả về 0 nếu không có promo', () => {
    expect(calculateDiscount(200000, null)).toBe(0);
  });
});

describe('calculateBookingPrice', () => {
  test('Tính toàn bộ đơn hàng không có promo', () => {
    const result = calculateBookingPrice('08:00', '10:00', 50000, null);
    expect(result).toEqual({
      hours: 2,
      basePrice: 100000,
      discountAmount: 0,
      totalPrice: 100000,
    });
  });

  test('Tính toàn bộ đơn hàng có promo giảm 20%', () => {
    const promo = { discount_type: 'percentage', discount_value: 20, min_order_value: 0, max_discount: null };
    const result = calculateBookingPrice('08:00', '12:00', 50000, promo);
    expect(result.hours).toBe(4);
    expect(result.basePrice).toBe(200000);
    expect(result.discountAmount).toBe(40000);
    expect(result.totalPrice).toBe(160000);
  });
});
