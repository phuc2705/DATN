-- Fix production DB: cập nhật email tất cả users về định dạng mới (bỏ dấu chấm)
-- Mật khẩu sau khi chạy: 123456
-- Cách nhanh: đặt FORCE_REINIT=true trên Render env vars → server tự reset DB

-- Đặt lại password tất cả users về "123456"
UPDATE users SET password_hash = '$2a$10$vGpmi5z7dz2CpaTbHxtx/.QeC8zaz8Ok/PJ.fhagcmtpejuyqtupq';

-- Cập nhật email về định dạng không có dấu chấm
UPDATE users SET email = 'admin@gmail.com'            WHERE user_type = 'admin';
UPDATE users SET email = 'nguyenvanbay@gmail.com'     WHERE full_name = 'Nguyễn Văn Bảy';
UPDATE users SET email = 'tranthitoan@gmail.com'      WHERE full_name = 'Trần Thị Toán';
UPDATE users SET email = 'ngoquangnguyen@gmail.com'   WHERE full_name = 'Ngô Quang Nguyện';
UPDATE users SET email = 'phamthiqgiang@gmail.com'    WHERE full_name = 'Phạm Thị Quỳnh Giang';
UPDATE users SET email = 'nguyenthimai@gmail.com'     WHERE full_name = 'Nguyễn Thị Mai';
UPDATE users SET email = 'tranthilan@gmail.com'       WHERE full_name = 'Trần Thị Lan';
UPDATE users SET email = 'lethihuong@gmail.com'       WHERE full_name = 'Lê Thị Hương';
UPDATE users SET email = 'phamthinga@gmail.com'       WHERE full_name = 'Phạm Thị Nga';
UPDATE users SET email = 'hoangthily@gmail.com'       WHERE full_name = 'Hoàng Thị Ly';
UPDATE users SET email = 'vuthithanh@gmail.com'       WHERE full_name = 'Vũ Thị Thanh';
UPDATE users SET email = 'dothihoa@gmail.com'         WHERE full_name = 'Đỗ Thị Hoa';
UPDATE users SET email = 'buithilinh@gmail.com'       WHERE full_name = 'Bùi Thị Linh';
UPDATE users SET email = 'duongthiphuong@gmail.com'   WHERE full_name = 'Dương Thị Phương';
UPDATE users SET email = 'ngothithao@gmail.com'       WHERE full_name = 'Ngô Thị Thảo';
UPDATE users SET email = 'dangthituyet@gmail.com'     WHERE full_name = 'Đặng Thị Tuyết';
UPDATE users SET email = 'dinhthuha@gmail.com'        WHERE full_name = 'Đinh Thị Thu Hà';
UPDATE users SET email = 'lythibichngoc@gmail.com'    WHERE full_name = 'Lý Thị Bích Ngọc';
UPDATE users SET email = 'trinhthiminhchau@gmail.com' WHERE full_name = 'Trịnh Thị Minh Châu';
UPDATE users SET email = 'caothithuthuy@gmail.com'    WHERE full_name = 'Cao Thị Thu Thủy';
UPDATE users SET email = 'luuthihongnhung@gmail.com'  WHERE full_name = 'Lưu Thị Hồng Nhung';
UPDATE users SET email = 'phungthidieulinh@gmail.com' WHERE full_name = 'Phùng Thị Diệu Linh';
UPDATE users SET email = 'tothibaotran@gmail.com'     WHERE full_name = 'Tô Thị Bảo Trân';
UPDATE users SET email = 'quachthimyduyen@gmail.com'  WHERE full_name = 'Quách Thị Mỹ Duyên';
UPDATE users SET email = 'macthihaiyen@gmail.com'     WHERE full_name = 'Mạc Thị Hải Yến';

-- Kiểm tra kết quả
SELECT user_id, email, full_name, user_type, is_active FROM users ORDER BY user_type, user_id;
