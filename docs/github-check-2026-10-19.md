# Kiểm tra trước khi đẩy GitHub — 19/10/2026

- ESLint toàn bộ src/test: đạt.
- Unit tests: 21 suites, 145 tests đạt.
- HTTP tests: 19/19 đạt.
- Production build: đạt.
- Khởi động production trên cổng tạm: health ok, PostgreSQL up; mobile bootstrap trả 5 mô hình và 51 câu; hai endpoint capabilities trả đúng trường công khai. Tiến trình kiểm tra được dừng sau khi hoàn tất.

Đã cập nhật HTTP test theo cờ mobileOAuth được API bổ sung, vẫn kiểm tra chính xác danh sách trường để ngăn lộ thông tin xác thực. Log và thư mục tmp được bỏ qua trong Git.

HTTP tests cần quyền kết nối localhost. Không áp migration hoặc thay đổi cấu hình OAuth nhà cung cấp trong lượt kiểm tra này.
