const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  REFUND_PENDING: 'refund_pending',
  REFUNDED: 'refunded',
};

const PAYMENT_METHOD = {
  CASH: 'cash',
  VNPAY: 'vnpay',
  BANK_TRANSFER: 'bank_transfer',
  E_WALLET: 'e_wallet',
};

const USER_TYPE = {
  CUSTOMER: 'customer',
  HELPER: 'helper',
  ADMIN: 'admin',
};

const PLATFORM_FEE_RATE = 0.20;
const BOOKING_TIMEOUT_SAME_DAY_MS = 2 * 60 * 60 * 1000;
const BOOKING_TIMEOUT_ADVANCE_MS = 4 * 60 * 60 * 1000;
const GAP_RULE_MINUTES = 30;
const OTP_EXPIRES_MINUTES = 5;
const BOOKING_MAX_ADVANCE_DAYS = 30;

module.exports = {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  USER_TYPE,
  PLATFORM_FEE_RATE,
  BOOKING_TIMEOUT_SAME_DAY_MS,
  BOOKING_TIMEOUT_ADVANCE_MS,
  GAP_RULE_MINUTES,
  OTP_EXPIRES_MINUTES,
  BOOKING_MAX_ADVANCE_DAYS,
};
