# Hướng Dẫn Chạy Hệ Thống CleanConnect

## A. Chạy Development (code + sửa lỗi)

### Bước 1 – Cài đặt lần đầu (chỉ cần 1 lần)
```bash
# Cài backend
cd backend && npm install && cd ..

# Cài frontend
cd frontend && npm install && cd ..
```

### Bước 2 – Khởi động (mở 2 terminal)
**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
# → Server chạy tại http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
# → App chạy tại http://localhost:5173
```

---

## B. Chạy Local Demo (báo cáo, demo tại chỗ)

> Chạy 1 server duy nhất tại `http://localhost:5000` — không cần terminal thứ 2.

```bash
# Từ thư mục gốc (DATN/)
npm run demo
```

Lệnh này sẽ:
1. Build frontend → `frontend/dist/`
2. Khởi động backend phục vụ cả API lẫn frontend tại **http://localhost:5000**

**Tài khoản demo:**
| Vai trò   | Email                          | Mật khẩu |
|-----------|-------------------------------|-----------|
| Admin     | admin@gmail.com               | 123456    |
| Khách hàng | nguyenvanbay@gmail.com        | 123456    |
| Người giúp việc | nguyenthimai@gmail.com  | 123456    |

---

## C. Deploy lên Render (production online)

### Lần đầu deploy
1. Push code lên GitHub
2. Vào [render.com](https://render.com) → New → Web Service → Connect GitHub repo
3. Render tự đọc `render.yaml` và cấu hình tất cả

### Các biến cần điền tay trong Render Dashboard
Vào **Environment** tab và thêm các biến sau (đánh dấu `sync: false` trong render.yaml):

| Biến | Giá trị |
|------|---------|
| `DB_PASSWORD` | Mật khẩu Aiven MySQL |
| `GMAIL_CLIENT_SECRET` | `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` |
| `GMAIL_REFRESH_TOKEN` | Lấy từ Google OAuth Playground |
| `FIREBASE_PRIVATE_KEY` | Paste toàn bộ nội dung `-----BEGIN PRIVATE KEY-----...` |

### Re-deploy sau khi sửa code
```bash
git add . && git commit -m "update" && git push
# Render tự động deploy
```

---

## D. Reset Database (khi cần)

```bash
# ⚠️ XÓA TOÀN BỘ DỮ LIỆU — chỉ dùng khi cần reset DB về trạng thái ban đầu
cd backend
FORCE_REINIT=true npm start
```

---

## E. Kiểm tra sức khỏe hệ thống

```bash
# Local
curl http://localhost:5000/api/health

# Production
curl https://connectclean.onrender.com/api/health
```
