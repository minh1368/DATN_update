# Car Rental Management System

Hệ thống thông tin quản lý cho thuê xe gồm backend FastAPI, frontend React/Vite và cơ sở dữ liệu PostgreSQL.

## Chức năng chính

- Khách hàng xem danh sách xe, lọc xe, xem chi tiết xe và gửi yêu cầu thuê.
- Nhân viên/quản trị viên quản lý xe, khách hàng, yêu cầu thuê, hợp đồng, thanh toán và người dùng.
- Dashboard thống kê doanh thu, số hợp đồng, số xe đang thuê và tỷ lệ sử dụng xe.
- Xuất báo cáo thanh toán ra CSV và Excel.
- Chat hỗ trợ khách hàng và AI Chat.

## Yêu cầu môi trường

- Python 3.12+
- Node.js 20+
- PostgreSQL

## Cài đặt backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Tạo database PostgreSQL:

```sql
CREATE DATABASE car_rental;
```

Mặc định backend dùng chuỗi kết nối:

```text
postgresql://postgres:123456@localhost/car_rental
```

Có thể đổi bằng biến môi trường:

```powershell
$env:DATABASE_URL="postgresql://postgres:123456@localhost/car_rental"
```

Chạy backend:

```powershell
python run_backend.py
```

Backend chạy tại `http://localhost:8000`.

## Cài đặt frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend chạy tại `http://localhost:5173`.

Nếu backend chạy port khác, tạo file `frontend/.env`:

```text
VITE_API_BASE_URL=http://localhost:8000
```

## Demo public bằng trycloudflare

Chạy backend và frontend ở local như hướng dẫn trên, sau đó mở tunnel cho frontend:

```powershell
cloudflared tunnel --url http://localhost:5173
```

Nếu cần public backend riêng, mở thêm một tunnel khác:

```powershell
cloudflared tunnel --url http://localhost:8000
```

Khi dùng tunnel backend riêng, cập nhật `frontend/.env`:

```text
VITE_API_BASE_URL=https://duong-dan-backend.trycloudflare.com
```

Sau đó khởi động lại frontend bằng `npm run dev`.

Nếu muốn gửi email OTP quên mật khẩu thật, thêm các biến môi trường SMTP vào file `.env` ở thư mục gốc:

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=you@example.com
SMTP_PASSWORD=mat-khau-ung-dung-hoac-password
SMTP_FROM=you@example.com
SMTP_USE_TLS=true
SMTP_USE_SSL=false
```

`SMTP_USERNAME`/`SMTP_PASSWORD` chỉ là tài khoản gửi email. Backend sẽ gửi mã OTP đến email của người dùng đã đăng ký yêu cầu quên mật khẩu, nên chức năng này áp dụng cho tất cả email người dùng thực tế.

Với Gmail, hãy sử dụng App Password hoặc cấu hình SMTP an toàn tương thích. Nếu bạn dùng `smtp.gmail.com`, mật khẩu phải là App Password chứ không phải mật khẩu đăng nhập Gmail thông thường.

## Dữ liệu mẫu

Import danh sách xe mẫu:

```powershell
python scripts/import_cars.py
```

Seed dữ liệu nghiệp vụ:

```powershell
python scripts/seed_data.py
```

## Tài khoản demo

Backend tự tạo tài khoản admin mặc định khi khởi động:

```text
Email: phamcongminh1368@gmail.com
Password: 123456
Role: admin
```

## AI Chat

Tạo file `.env` ở thư mục gốc theo mẫu `.env.example`, sau đó thêm một trong các API key:

```text
GEMINI_API_KEY=...
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
```

Nếu không cấu hình API key, chức năng AI Chat sẽ trả thông báo chưa cấu hình.

## Ghi chú bảo mật

- Mật khẩu user/customer mới được hash bằng PBKDF2-SHA256.
- Dữ liệu mật khẩu cũ dạng plain text vẫn đăng nhập được một lần, sau đó tự chuyển sang dạng hash.
- Phân quyền quản trị dùng JWT Bearer token; frontend không còn gửi quyền qua `X-User-Role`.
