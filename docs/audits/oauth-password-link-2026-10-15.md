# Google và mật khẩu dùng chung tài khoản — 15/10/2026

> Luồng bắt xác nhận bên dưới đã được thay theo yêu cầu mới: OAuth chưa liên kết
> đăng nhập tài khoản riêng; liên kết chỉ còn là lựa chọn trong Cài đặt. Xem
> `independent-oauth-2026-10-15.md`. Báo cáo này giữ lại kết quả của bản trước.

Trước sửa: OAuth callback gặp email đã đăng ký mật khẩu trả JSON 409, khiến
người dùng tưởng không thể dùng cả hai cách đăng nhập.

Sau sửa: callback chuyển về `/dang-nhap?link_provider=google` (hoặc nhà cung cấp
tương ứng). Giao diện yêu cầu xác nhận email và mật khẩu một lần. Sau đăng nhập,
frontend gọi `POST /api/auth/oauth/:provider/link` bằng Bearer header; backend tạo
OAuth state gắn với tài khoản đã xác thực, tiếp tục OAuth và thêm provider ID.
Không gửi session token qua query string của endpoint mới. Không thay passwordHash,
không tạo tài khoản trùng hoặc đổi dữ liệu học. Các lần đăng nhập Google sau tra
theo provider ID, đăng nhập mật khẩu vẫn dùng cùng tài khoản.

Kiểm thử tự động bằng token/profile provider giả lập, không thay tài khoản thật:

- Luồng đầy đủ: callback lần đầu → xác nhận mật khẩu → state liên kết đúng owner →
  callback thành công → Google và mật khẩu trả cùng ID; passwordHash giữ nguyên.
- Không có session/session giả: không tạo state liên kết.
- Sai mật khẩu: không tạo session, không liên kết.
- Provider thuộc tài khoản khác: từ chối, không ghi đè owner.
- Tài khoản bị khóa: không chuyển sang xác nhận hoặc tạo session/liên kết.

Backend lint/build đạt, 89/89 unit và 19/19 HTTP test đạt. Backend đang chạy đã
được khởi động lại: POST liên kết ẩn danh trả 401 đúng, health và truy xuất RAG
thật đều trả 200. Không sửa liên kết Google thật hoặc mật khẩu người dùng để test.
Màn hình xác nhận và nút quay lại đăng nhập đã thao tác trên browser; bản ghi
ảnh tại `Soma_Fe/docs/audits/oauth-password-link-2026-10-15.png`.

Frontend lint, TypeScript và production build cuối đều đạt (670 trang); 12/12
test hồi quy session/request phía frontend đạt.

Build frontend lần đầu gặp file type tự sinh trong cache dev bị ghi dở. Đã tách
`tsconfig.build.json` khỏi `.next-dev` để production không đọc cache dev đang đổi;
vẫn giữ kiểm tra TypeScript bật đầy đủ. Không xóa cache hoặc tắt kiểm tra lỗi kiểu.

Người dùng cần hoàn tất Google thật trên Chrome/Edge: bấm Google lại từ đầu,
xác nhận mật khẩu khi được hỏi, chọn tài khoản Google và hoàn tất liên kết.
URL callback đã dùng trước khi sửa không thể dùng lại vì OAuth state là một lần.
