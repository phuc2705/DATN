// Tiện ích tích hợp cổng thanh toán VNPay
// Sử dụng thuật toán HMAC-SHA512 để ký và xác thực giao dịch
const crypto = require('crypto');
const qs = require('qs');

const createVNPayUrl = (bookingId, amount, orderInfo, ipAddr) => {
  const now = new Date();
  // Format: YYYYMMDDHHmmss theo múi giờ VN (UTC+7)
  const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const createDate = vnTime.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const txnRef = `${bookingId}_${Date.now()}`;

  let params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: process.env.VNP_TMN_CODE,
    vnp_Amount: Math.round(parseFloat(amount)) * 100,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: process.env.VNP_RETURN_URL,
    vnp_IpAddr: ipAddr || '127.0.0.1',
    vnp_CreateDate: createDate,
  };

  // Sắp xếp tham số theo thứ tự alphabet trước khi ký
  params = Object.fromEntries(Object.entries(params).sort());
  const signData = qs.stringify(params, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
  params.vnp_SecureHash = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  return process.env.VNP_URL + '?' + qs.stringify(params, { encode: false });
};

const verifyVNPayReturn = (query) => {
  const secureHash = query.vnp_SecureHash;
  if (!secureHash) return false;

  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const sorted = Object.fromEntries(Object.entries(params).sort());
  const signData = qs.stringify(sorted, { encode: false });
  const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  return signed === secureHash;
};

module.exports = { createVNPayUrl, verifyVNPayReturn };
