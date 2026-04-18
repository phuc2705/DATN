// Logic tính giá được tập trung tại Backend để đảm bảo tính minh bạch
// KHÔNG để Frontend tự tính giá vì dễ bị giả mạo

/**
 * Tính số giờ làm việc từ start_time đến end_time
 * @param {string} startTime - "08:00"
 * @param {string} endTime   - "12:00"
 * @returns {number} số giờ (VD: 4.0, 2.5)
 */
const calculateHours = (startTime, endTime) => {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const totalMinutes = (endH * 60 + endM) - (startH * 60 + startM);
  if (totalMinutes <= 0) throw new Error('Giờ kết thúc phải sau giờ bắt đầu');
  return Math.round((totalMinutes / 60) * 100) / 100; // Làm tròn 2 chữ số
};

/**
 * Tính giá cơ bản (trước khuyến mãi)
 * Ưu tiên dùng custom_price của helper nếu có, ngược lại dùng base_price dịch vụ
 * @param {number} hours
 * @param {number} helperHourlyRate - Giá/giờ của helper (custom hoặc base service)
 * @returns {number} tổng tiền trước giảm giá
 */
const calculateBasePrice = (hours, helperHourlyRate) => {
  return Math.round(hours * helperHourlyRate * 100) / 100;
};

/**
 * Tính số tiền được giảm từ mã khuyến mãi
 * @param {number} basePrice - Giá trước giảm
 * @param {Object} promo     - Thông tin promotion { discount_type, discount_value, max_discount, min_order_value }
 * @returns {number} số tiền được giảm
 */
const calculateDiscount = (basePrice, promo) => {
  if (!promo) return 0;

  // Kiểm tra đơn hàng tối thiểu
  if (basePrice < promo.min_order_value) return 0;

  let discount = 0;
  if (promo.discount_type === 'percentage') {
    discount = basePrice * (promo.discount_value / 100);
    // Áp dụng giới hạn giảm tối đa nếu có
    if (promo.max_discount && discount > promo.max_discount) {
      discount = promo.max_discount;
    }
  } else if (promo.discount_type === 'fixed') {
    discount = promo.discount_value;
  }

  // Giảm không được vượt quá giá gốc
  return Math.min(Math.round(discount * 100) / 100, basePrice);
};

/**
 * Tính tổng đơn hàng sau khuyến mãi
 * @returns {{ hours, basePrice, discountAmount, totalPrice }}
 */
const calculateBookingPrice = (startTime, endTime, helperHourlyRate, promo = null) => {
  const hours = calculateHours(startTime, endTime);
  const basePrice = calculateBasePrice(hours, helperHourlyRate);
  const discountAmount = calculateDiscount(basePrice, promo);
  const totalPrice = Math.round((basePrice - discountAmount) * 100) / 100;

  return { hours, basePrice, discountAmount, totalPrice };
};

module.exports = { calculateHours, calculateBasePrice, calculateDiscount, calculateBookingPrice };
