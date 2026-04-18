# Đề tài: Hệ thống số hóa dịch vụ giúp việc gia đình theo giờ

## 1. Thông tin dự án & Công nghệ
- **Ngôn ngữ**: JavaScript (ES6+)
- **Backend**: Node.js, Express framework
- **Frontend**: ReactJS, Tailwind CSS
- **Database**: MySQL (Yêu cầu tính toàn vẹn dữ liệu cao)
- **Xác thực**: JWT (JSON Web Token)
- **Kiến trúc**: Client-Server, RESTful API

## 2. Lệnh hệ thống (Build & Test)
- **Cài đặt**: `npm install` (thực hiện ở cả /backend và /frontend)
- **Chạy Backend**: `cd backend && npm run dev`
- **Chạy Frontend**: `cd frontend && npm start`
- **Kiểm thử API**: Sử dụng Postman
- **Unit Test**: `npm test`

## 3. Quy tắc lập trình (Coding Rules)
- **Cấu trúc**: Phân tách rõ ràng folder `backend` và `frontend`.
- **Đặt tên**: Tên biến, hàm, API endpoint bằng tiếng Anh (camelCase).
- **Ngôn ngữ phản hồi**: Comment giải thích logic code bằng tiếng Việt để phục vụ báo cáo đồ án.
- **Bảo mật**: 
    - Mọi API (trừ Đăng nhập/Đăng ký) phải được bảo vệ bởi Middleware xác thực JWT.
    - Phân quyền rõ ràng giữa: Khách hàng (Client), Người giúp việc (Helper) và Quản trị (Admin).
- **Nghiệp vụ đặc thù**:
    - Logic tính giá phải được viết tập trung tại Backend để đảm bảo minh bạch.
    - Luồng Matching (điều phối) và Check-in/Check-out phải có log lịch sử rõ ràng.

## 4. Quy tắc Unit Test & Database
- **Vị trí**: File test nằm trong thư mục `tests/` của từng module.
- **Database**: Luôn tạo file `schema.sql` để lưu trữ cấu trúc bảng. Ưu tiên sử dụng Transaction cho các thao tác đặt lịch và thanh toán.
- **Kiểm thử**: Mọi logic tính giá tự động và điều phối người làm phải có Unit Test bao phủ (coverage) ít nhất 90%.