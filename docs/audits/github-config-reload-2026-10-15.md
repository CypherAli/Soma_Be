# GitHub không bật sau khi thêm cấu hình — 15/10/2026

Nguyên nhân xác minh: `.env` có GITHUB_CLIENT_ID và GITHUB_CLIENT_SECRET, nhưng
backend đang chạy trả `oauth.github=false`. Tiến trình được mở trước khi người
dùng bổ sung cấu hình và chưa nạp lại môi trường.

Đã xác minh PID/cổng 4000 và command line backend Soma, khởi động lại đúng tiến
trình. Không thay ID/Secret hoặc tài khoản. `/api/auth/capabilities` sau đó trả
Google=true, GitHub=true, Facebook=false.

Browser tải lại trang đăng nhập: nút GitHub đã bật và dẫn đúng endpoint backend.
Bấm GitHub mở trang chính thức github.com có thông báo “Sign in to GitHub to
continue to Soma”. Callback gửi đi đúng
`http://localhost:4000/api/auth/oauth/github/callback`, có state và PKCE S256.

Chưa nhập thông tin GitHub, cấp quyền hoặc hoàn tất callback bằng tài khoản thật.
Người dùng cần tải lại trang Soma và tiếp tục đăng nhập GitHub để nghiệm thu
toàn bộ luồng. Không ghi nonce OAuth hoặc bí mật vào báo cáo này.

Bằng chứng: `Soma_Fe/docs/audits/github-enabled-2026-10-15.png` và
`Soma_Fe/docs/audits/github-signin-2026-10-15.png`.
