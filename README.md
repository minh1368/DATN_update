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

## Chạy test

```powershell
python -m unittest discover -s tests -v
```

Nếu đã cài `pytest`, cũng có thể chạy:

```powershell
python -m pytest
```

Các test hiện dùng SQLite tạm thời, không ảnh hưởng database PostgreSQL thật.

## Ghi chú bảo mật

- Mật khẩu user/customer mới được hash bằng PBKDF2-SHA256.
- Dữ liệu mật khẩu cũ dạng plain text vẫn đăng nhập được một lần, sau đó tự chuyển sang dạng hash.
- Phân quyền hiện vẫn ở mức demo qua `X-User-Role`; hướng phát triển tiếp theo là JWT/session bảo mật.
