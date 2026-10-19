# OAuth độc lập và liên kết tự chọn — 15/10/2026

Theo yêu cầu người dùng: tài khoản đã liên kết thì đăng nhập trực tiếp; tài khoản
Google/GitHub chưa liên kết được dùng độc lập, không bắt nhập mật khẩu Soma.

## Thay đổi

- OAuth tra tài khoản theo provider ID duy nhất. Không tra/gộp theo email.
- Nếu ID chưa tồn tại, tạo tài khoản riêng với quyền user mặc định. Cùng email
  liên hệ vẫn có thể có tài khoản mật khẩu, Google và GitHub riêng biệt.
- Liên kết đã có giữ nguyên và tiếp tục vào thẳng cùng tài khoản. Chỉ luồng
  liên kết chủ động từ phiên đã xác thực mới thêm provider vào tài khoản chung.
- Người dùng không thể lấy provider ID của tài khoản khác bằng cách liên kết;
  các tài khoản đã tồn tại không tự gộp hoặc chuyển dữ liệu học.
- Tách passwordEmail duy nhất khỏi email liên hệ. Đăng ký, đăng nhập và quên
  mật khẩu chọn đúng tài khoản mật khẩu, tránh reset nhầm khi trùng email OAuth.
- Frontend bỏ màn hình ép liên kết; URL cũ chứa link_provider tự về đăng nhập thường.
- CLI cấp quyền từ email từ chối khi có nhiều tài khoản trùng email, để quản trị
  chọn đúng ID trong giao diện thay vì cấp quyền nhầm người.

## Database

Đã backup riêng trước migration vào thư mục `.backup-qa` được bỏ qua trong Git.
Áp migration `20261015060000_independent_oauth_accounts`; tổng 16 migration.
SQL giữ nguyên toàn bộ hàng user cũ, chỉ thêm trường định danh mật khẩu và đổi
index. Snapshot các tài khoản trước/sau (bỏ trường mới) khớp hoàn toàn, bao gồm
hash mật khẩu, quyền, provider ID và thời gian. Sáu bảng học tập cũng khớp.
Không xóa hoặc tách các liên kết thật mà người dùng đã tạo trước đó.

## Kiểm tra

- Frontend lint, TypeScript và production build đạt (670 trang).
- Backend lint/build, toàn bộ unit và 19 HTTP test đạt.
- Bộ integration PostgreSQL thật với provider giả lập: 7/7 đạt; có ba tài khoản
  cùng email, đăng nhập lại từng provider đúng ID, liên kết chủ động vẫn dùng chung
  tài khoản, mật khẩu/reset chọn đúng tài khoản và chặn chiếm provider của người khác.
- Fixture được dọn đúng marker/ID, không gửi email hoặc gọi provider thật.
- Kiểm tra database chỉ đọc: 22/22 đạt, 20 khóa ngoại hợp lệ.
- Browser mở URL cũ của GitHub: trở về đăng nhập thường, không còn form bắt liên kết;
  Google/GitHub đều bật. Ảnh tại `Soma_Fe/docs/audits/independent-oauth-login-2026-10-15.png`.

Bằng chứng: `independent-oauth-migration.json`, `independent-oauth-postgres-qa.json`,
`database-audit.json`; test hồi quy trong `src/auth/oauth-link.spec.ts`.
Nhận diện từ provider được giả lập trong test; không tự cấp quyền ứng dụng hoặc
thay đổi tài khoản Google/GitHub thật của người dùng để nghiệm thu.
