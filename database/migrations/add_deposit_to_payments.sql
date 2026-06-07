-- Migration: Thêm các cột hỗ trợ hệ thống đặt cọc (deposit) vào bảng payments
-- Áp dụng cho database đã tồn tại. Chạy 1 lần duy nhất.

ALTER TABLE payments
  ADD COLUMN deposit_amount DECIMAL(10,2) NULL DEFAULT NULL
    COMMENT '70% tiền cọc trước (VNPay), dành cho khách hàng mới hoặc uy tín thấp'
    AFTER paid_at,

  ADD COLUMN deposit_transaction_id VARCHAR(100) NULL DEFAULT NULL
    COMMENT 'Mã giao dịch VNPay của tiền cọc'
    AFTER deposit_amount,

  ADD COLUMN deposit_paid_at TIMESTAMP NULL DEFAULT NULL
    COMMENT 'Thời điểm đóng cọc thành công'
    AFTER deposit_transaction_id,

  ADD COLUMN remaining_payment_method ENUM('cash', 'vnpay') NULL DEFAULT NULL
    COMMENT 'Phương thức thanh toán 30% còn lại sau khi dịch vụ hoàn thành'
    AFTER deposit_paid_at,

  MODIFY COLUMN payment_status
    ENUM('unpaid','deposit_paid','paid','refunded','refund_pending','deposit_forfeited')
    DEFAULT 'unpaid'
    COMMENT 'deposit_forfeited = tiền cọc bị tịch thu do khách bom lịch sau khi helper đã nhận đơn';
