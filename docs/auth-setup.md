# Hoàn tất đăng nhập và đăng ký Soma

## Những gì đang có

Đăng ký email/mật khẩu: họ tên ít nhất 2 ký tự, mật khẩu ít nhất 8 ký tự gồm chữ
và số, nhập lại mật khẩu và đồng ý điều khoản. Backend tạo tài khoản `user`, lưu
hash mật khẩu và tạo phiên đăng nhập ngay. UI ở `/dang-nhap`, tab Đăng ký.
Đăng nhập bằng tài khoản hiện hữu đã kiểm thử với PostgreSQL thật; chưa tạo thêm
tài khoản thật để thử đăng ký trong lượt này.

Hiện không có OTP/xác minh email khi đăng ký. SMTP đang phục vụ quên mật khẩu,
không biến đăng ký thành luồng xác minh email. SMTP đã kiểm tra kết nối/xác thực
ở lượt trước; chưa gửi email khôi phục thật hoặc thay mật khẩu người dùng.

OAuth đã có code cho Google/GitHub/Facebook; cần cấu hình ứng dụng của từng nhà
cung cấp. Client ID là mã của ứng dụng Soma; Client Secret là bí mật backend.
Điền trực tiếp vào `soma_be/.env`, không đặt vào `NEXT_PUBLIC_*` hoặc gửi qua chat.
Giữ nguyên DATABASE_URL, SMTP và các cấu hình hiện hữu, không chép đè toàn bộ `.env`.

## Google

1. Mở [Google Cloud Console](https://console.cloud.google.com/), chọn/tạo project Soma.
2. Trong Google Auth Platform, điền Branding cho ứng dụng. Data Access chỉ cần
   các scope đăng nhập `openid`, `email`, `profile`. Tạo OAuth client loại
   **Web application** trong Clients. [Tài liệu Google](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
3. Authorized JavaScript origins dùng `http://localhost:3000`; Authorized redirect
   URIs phải là **`http://localhost:4000/api/auth/oauth/google/callback`** theo
   callback backend hiện tại. Không dùng `/oauth-callback` của frontend ở ô này.
   URL redirect phải khớp cấu hình. [OAuth web server](https://developers.google.com/identity/protocols/oauth2/web-server).
4. Điền hai giá trị nhận từ console vào cấu hình dưới đây rồi khởi động lại backend.

```dotenv
API_URL=http://localhost:4000/api
FRONTEND_URL=http://localhost:3000
GOOGLE_CLIENT_ID=CLIENT_ID_CUA_BAN
GOOGLE_CLIENT_SECRET=CLIENT_SECRET_CUA_BAN
```

Đây là cấu hình OAuth server đang có của Soma; không cần thay bằng thư viện One Tap
chỉ để làm theo phần lấy Client ID trong tài liệu. Kiểm tra OAuth bằng Chrome/Edge
thông thường; Google có hạn chế đối với trình duyệt nhúng.
[Chính sách Google OAuth](https://developers.google.com/identity/protocols/oauth2/policies).

## GitHub

Vào Settings → Developer settings → OAuth apps → New OAuth App. Điền homepage
`http://localhost:3000` và callback
`http://localhost:4000/api/auth/oauth/github/callback`. Lấy Client ID và tạo Client
Secret, điền vào `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` trong backend `.env`.
[Hướng dẫn GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app).

## Facebook

Backend dùng `FACEBOOK_CLIENT_ID` cho App ID và `FACEBOOK_CLIENT_SECRET` cho App
Secret. Callback code hiện tại là
`http://localhost:4000/api/auth/oauth/facebook/callback`. Cấu hình ứng dụng tại
[Meta for Developers](https://developers.facebook.com/apps/).

Tài liệu Meta trả 429 ở lượt tra cứu này, nên chưa xác minh các màn hình console,
yêu cầu localhost và điều kiện đưa app vào hoạt động hiện hành. Khi Meta yêu cầu
URL HTTPS, dùng domain backend HTTPS thật, cập nhật `API_URL` và callback tương
ứng; không nhập URL frontend thay cho backend. Không coi Facebook OAuth đã được
nghiệm thu chỉ vì đã điền đủ hai biến môi trường.

## Khởi động và kiểm tra

Sau khi lưu `.env`, khởi động lại tiến trình backend đang chạy. Nếu đang dùng
terminal dev, dừng bằng Ctrl+C rồi chạy trong thư mục `soma_be`:

```powershell
npm run start:dev
```

Frontend `.env.local` phải có `NEXT_PUBLIC_API_URL=http://localhost:4000/api`.
Nếu sửa biến này thì khởi động lại frontend; production cần build lại.
Mở [capabilities](http://localhost:4000/api/auth/capabilities): provider đã cấu
hình phải có cờ `true`, sau đó tải lại trang đăng nhập. Cờ chỉ xác minh có cấu
hình, chưa xác minh ID/Secret hợp lệ hoặc toàn bộ OAuth chạy thành công.

- Tài khoản đã liên kết Google/GitHub: bấm nhà cung cấp để vào thẳng tài khoản
  chung, không hỏi liên kết lại.
- Nhà cung cấp chưa liên kết: đăng nhập/tạo tài khoản riêng theo ID của Google,
  GitHub hoặc Facebook, kể cả email liên hệ trùng tài khoản mật khẩu hay nhà
  cung cấp khác. Dữ liệu học của từng tài khoản riêng biệt.
- Liên kết là tùy chọn trong Cài đặt → Kết nối khi muốn dùng chung tài khoản.
  Nếu nhà cung cấp đã thuộc một tài khoản riêng, hệ thống không tự chuyển hay
  gộp dữ liệu sang tài khoản đang đăng nhập.
- Người dùng mới: OAuth thành công tự tạo tài khoản riêng; không cần đăng ký email trước.
- Đăng ký thường: dùng một email thử khác, tự nhập mật khẩu và xác nhận điều khoản,
  kiểm tra vào được quiz/tài liệu cá nhân, đăng xuất rồi đăng nhập lại.
- Quên mật khẩu: dùng email thử do bạn kiểm soát, kiểm tra cả Spam, mở link trong
  15 phút và tự đặt mật khẩu. Không dùng tài khoản chính để thử nếu không muốn
  thu hồi phiên của nó; reset thành công sẽ cắt các phiên cũ.

Khi đưa lên hosting, thay API_URL, FRONTEND_URL, NEXT_PUBLIC_API_URL và các callback
bằng domain tương ứng. Không giữ `localhost` trong cấu hình production.

## Email

SMTP hiện có không cần cấu hình lại nếu vẫn đúng. Nếu Gmail từ chối xác thực,
kiểm tra App Password và xác minh hai bước theo [hướng dẫn Google](https://support.google.com/accounts/answer/185833).
App Password dùng cho SMTP, khác với OAuth Client Secret và mật khẩu đăng nhập Soma.
