# Kịch Bản Demo Hệ Thống Cho Thuê Xe

## 1. Chuẩn bị

1. Chạy PostgreSQL và tạo database `car_rental`.
2. Chạy backend: `python run_backend.py`.
3. Chạy frontend: `cd frontend && npm run dev`.
4. Mở `http://localhost:5173`.
5. Đăng nhập admin:
   - Email: `phamcongminh1368@gmail.com`
   - Mật khẩu: `123456`

## 2. Demo phía khách hàng

1. Vào trang chủ.
2. Mở trang `Thuê xe tự lái`.
3. Lọc xe theo hãng, số chỗ hoặc giá.
4. Mở chi tiết một xe.
5. Đăng ký/đăng nhập khách hàng.
6. Gửi yêu cầu thuê xe với ngày bắt đầu và ngày kết thúc hợp lệ.
7. Mở trang `Lịch sử thuê` để xem trạng thái yêu cầu.
8. Thử gửi thêm yêu cầu trùng thời gian để kiểm tra hệ thống chặn một khách thuê hai xe cùng lúc.

## 3. Demo phía quản trị

1. Vào `/admin`.
2. Xem dashboard tổng quan:
   - tổng doanh thu
   - số hợp đồng
   - tổng số xe
   - xe đang thuê
   - biểu đồ doanh thu
3. Tab `Xe`:
   - thêm xe mới
   - sửa thông tin xe
   - xóa xe nếu không có dữ liệu liên quan
4. Tab `Khách hàng`:
   - thêm/sửa/xóa khách hàng
5. Tab `Yêu cầu thuê`:
   - xác nhận khoản đặt cọc bằng thao tác duyệt yêu cầu
   - từ chối yêu cầu
6. Tab `Thanh toán`:
   - xác nhận khoản tiền còn lại của yêu cầu đã duyệt
   - tạo hợp đồng sau khi đã xác nhận đủ tiền
7. Tab `Hợp đồng`:
   - kiểm tra xe chuyển sang `rented`
   - trả xe sau khi thanh toán
8. Tab `Người dùng`:
   - thêm/sửa/xóa nhân viên hoặc admin

## 4. Demo báo cáo

1. Vào dashboard tổng quan.
2. Chọn khoảng thời gian thống kê.
3. Xuất CSV.
4. Xuất Excel.

## 5. Demo chat

1. Với khách hàng: mở khung chat nổi, gửi tin nhắn tới nhân viên.
2. Với admin/staff: mở tab chat nhân viên để xem hội thoại và trả lời.
3. Mở tab AI để hỏi thử một câu về thuê xe.

## 6. Tình huống kiểm tra lỗi

1. Tạo yêu cầu thuê có ngày bắt đầu sau ngày kết thúc.
2. Tạo yêu cầu thuê trùng lịch xe đã có request/contract đang hoạt động.
3. Tạo yêu cầu thuê xe khác nhưng trùng thời gian của cùng khách hàng.
4. Truy cập hồ sơ/lịch thuê bằng ID khách hàng khác để kiểm tra API từ chối.
5. Xóa xe đang thuê hoặc có hợp đồng liên quan.
6. Tạo hợp đồng khi chưa thanh toán đủ.
