# Premium: 25.000đ/tháng

Gói Thường có 10 câu hỏi/tháng, Premium có 30. Hạn mức làm mới lúc 00:00 ngày 1 theo Asia/Ho_Chi_Minh. Nâng cấp không xoá lượt đã dùng. Premium kéo dài một tháng từ thời điểm nhận tiền; gia hạn trước hạn được cộng tiếp từ ngày hết hạn. Không tự trích tiền. Tóm tắt biên soạn sẵn không gọi mô hình và không trừ lượt.

## Cổng thanh toán SePay (SDK Node.js, Sandbox và Production)

Áp dụng thêm migration `20261026020000_sepay_gateway`, chạy `npm run prisma:generate` và build lại backend. Cấu hình trong `.env.sepay.local` (đã được Git bỏ qua) hoặc biến môi trường máy chủ:

```dotenv
SEPAY_PG_ENABLED=true
SEPAY_PG_ENV=sandbox
SEPAY_PG_MERCHANT_ID=<copy từ SePay>
SEPAY_PG_SECRET_KEY=<copy từ SePay>
SEPAY_PG_PUBLIC_BASE_URL=https://<public-payment-ingress>
```

Secret chỉ được backend dùng để ký form bằng SDK chính thức `sepay-pg-node` và gọi API kiểm tra đơn. Frontend nhận form đã ký, số tiền cố định 25.000đ, mã đơn riêng và URL quay lại. Không dùng đoạn SDK có secret bên trong component React chạy ở trình duyệt.

Mô tả đơn hiển thị là `Premium soma`. Với QR trực tiếp, số tiền được điền sẵn 25.000đ và nội dung là `Premium soma SOMA<mã đơn>`. Với QR do cổng SePay phát hành, nội dung chuyển khoản do SePay cấp (ví dụ `PAY...`) cần được giữ nguyên để tự đối soát; `order_description` là mô tả hiển thị, không phải tham số ghi đè nội dung chuyển khoản. QR tài khoản tĩnh không thay thế QR theo từng đơn của checkout.

### QR tại trang tài khoản

Migration `20261026030000_inline_checkout` thêm `PremiumOrder.paymentSession`. Backend khởi tạo form đã ký ở SePay, xác minh redirect cùng host/đúng hóa đơn/đúng25.000đ, phân tích riêng ảnh `.qrcode`, số tài khoản và mã chuyển khoản từ checkout. Không nhúng iframe (SePay trả `X-Frame-Options: SAMEORIGIN`), không render HTML/script của trang ngoài. Phiên được lưu theo đơn và khởi tạo dưới khóa hàng, nên tải lại hoặc mở nhiều tab vẫn giữ cùng QR/mã đối soát. Ảnh chỉ được chấp nhận từ danh sách host QR xác định. Nếu markup thay đổi/QR thật thiếu thì báo lỗi, không thay bằng QR tài khoản cũ; ảnh placeholder bị từ chối trong Production.

Sandbox hiện dùng ảnh QR minh họa của SePay, ghi rõ không chuyển tiền thật. Nút giả lập trong trang gọi `POST /api/membership/orders/:id/simulate`, bắt buộc đăng nhập và sở hữu đơn chờ Sandbox. Môi trường Production không nhận thao tác này. Giả lập chỉ yêu cầu SePay mô phỏng, còn cấp Premium vẫn qua IPN đã đối chiếu API. `node scripts/qa-inline-checkout.cjs` kiểm thử trọn luồng Sandbox với tài khoản tạm, giữ nguyên trang, tải lại phiên, màn hình nhỏ và Premium30/30.

Trong SePay, điền IPN URL `https://<public-payment-ingress>/api/membership/sepay/ipn`, lưu và gửi test. Endpoint trả 200 với `processed:false` cho thông báo thử không thuộc đơn nào. IPN có `X-Secret-Key` sẽ được đối chiếu bằng so sánh thời gian hằng; dù có hoặc không có header, backend luôn gọi API SePay bằng Basic Auth để xác minh đơn trước khi cấp Premium. Trạng thái phải là `CAPTURED`, tiền VND đúng 25.000đ và mã đơn khớp. Nếu API có lịch sử giao dịch, yêu cầu giao dịch chuyển khoản `PAYMENT/APPROVED` đúng tiền; trường hợp lịch sử rỗng được xác minh bằng ID đơn từ API đã xác thực như mô tả bên dưới. Một thông báo lặp lại không cộng thêm tháng. URL quay lại và cờ `payment=success` không kích hoạt gói.

Đơn Sandbox và Production có trường `provider` riêng, mỗi môi trường chỉ có một đơn chờ/tài khoản. Thanh toán Sandbox chỉ cập nhật `sandboxPremiumUntil`, không chạm vào gói đã trả tiền thật. Chế độ Sandbox cho phép thử hạn mức 30 câu; chuyển sang Production sẽ không công nhận thời hạn Sandbox. Thay merchant/key bằng bộ Production và dùng `SEPAY_PG_ENV=production` sau khi hoàn tất liên kết ngân hàng/thử nghiệm. Không có tự động trừ tiền gia hạn.

Đã kiểm chứng cả Sandbox và một giao dịch Production thật có thể trả đơn `CAPTURED` với lịch sử giao dịch rỗng. Backend chấp nhận bằng chứng trực tiếp từ API SePay đã xác thực khi mã đơn khớp, VND, đúng25.000đ, trạng thái `CAPTURED` và có ID đơn phía SePay; dùng ID đơn đó làm mã chống lặp. Nếu API cung cấp danh sách giao dịch không rỗng, vẫn yêu cầu một giao dịch chuyển khoản `PAYMENT/APPROVED` đúng tiền và tiền tệ. Không lấy trạng thái từ trình duyệt hoặc payload IPN chưa đối chiếu để cấp gói.

`GET /api/membership/orders/:id` kiểm tra chủ sở hữu trước khi đối soát với SePay, nhờ đó mở lại trang/app hoặc bấm Kiểm tra thanh toán có thể phục hồi khi IPN bị mất. Các tab dùng chung yêu cầu đang chạy và cache ngắn4giây; map có giới hạn256đơn. Việc cấp gói dùng chung transaction với IPN, không cộng tháng lại khi đọc hoặc thông báo lặp. Có10kiểm thử hồi quy ở `sepay-reconcile.spec.ts`, gồm Production `CAPTURED` không có lịch sử, sai chủ, sai tiền/trạng thái/tiền tệ/mã đơn và lỗi mạng.

### Chuyển sang thanh toán thật

Trong SePay, liên kết ngân hàng nhận tiền, mở Cổng thanh toán và chọn chuyển sang Production. Copy bộ Merchant ID/Secret Key Production vào `.env.sepay.local`, đặt `SEPAY_PG_ENV=production` và `SEPAY_PG_ENABLED=true`. Không dùng merchant bắt đầu `SP-TEST-`. Chạy `node scripts/check-sepay-production.cjs` để kiểm tra chỉ đọc với API thật; script không tạo đơn, không chuyển tiền và không in khóa. Chỉ nạp lại backend sau khi khóa đã được xác thực. Lưu URL IPN ở cấu hình **Production** trên SePay, không chỉ ở Sandbox.

QR thật phải do SePay cấp cho từng đơn 25.000đ. Nếu QR nhúng không tải được hoặc cấu trúc trang thay đổi, frontend vẫn nhận form checkout đã ký để đi tiếp qua trang chính thức của SePay. Không dùng ảnh QR minh họa cho Production. Khi đổi môi trường, trang tài khoản bỏ phiên Sandbox đang lưu để người dùng tạo đơn thật. Triển khai lâu dài cần hostname HTTPS cố định; tunnel thử nghiệm chỉ hoạt động trong lúc tiến trình/máy đang chạy.

### Kiểm thử từ localhost

Chạy backend port4000, frontend port3000 và `node scripts/sepay-ipn-proxy.cjs` (port4011). Mở tunnel HTTPS tới **port4011**, không mở toàn bộ port4000. Proxy chỉ nhận POST IPN JSON tối đa64KiB, và GET `/payments/sepay/return` chuyển về trang tài khoản cố định; các đường dẫn khác trả404. Ví dụ: `cloudflared tunnel --url http://127.0.0.1:4011 --protocol http2`. Lưu hostname tunnel vào `SEPAY_PG_PUBLIC_BASE_URL`, nạp lại backend rồi điền URL IPN tương ứng ở SePay. Quick Tunnel là địa chỉ tạm, dừng tiến trình/máy thì mất kết nối; khởi động lại có thể đổi URL. Production cần domain HTTPS ổn định và route quay lại tương ứng.

Vào trang tài khoản → Nâng cấp → Tiếp tục đến SePay. Dùng mô phỏng thanh toán của Sandbox, không chuyển tiền thật. Sau khi quay về, trang đọc trạng thái đơn của tài khoản đã đăng nhập và tự cập nhật Premium sau khi backend nhận IPN. Nếu chọn hủy/lỗi, có thể mở lại cùng đơn chờ.

QA: `node scripts/qa-sepay-gateway.cjs` kiểm tra ký form, giá cố định, đối chiếu API, sai tiền/trạng thái/tiền tệ, thông báo giả/lặp/đồng thời và cách ly Sandbox/Production trên tài khoản PostgreSQL tạm. `node scripts/qa-membership.cjs` giữ kiểm tra luồng webhook ngân hàng và hạn mức10/30.

Tài liệu chính thức: [Node SDK](https://developer.sepay.vn/vi/cong-thanh-toan/sdk/nodejs), [IPN](https://developer.sepay.vn/vi/cong-thanh-toan/IPN), [API đơn hàng](https://developer.sepay.vn/vi/cong-thanh-toan/API/don-hang/chi-tiet-don-hang).

## Webhook biến động số dư (phương án QR ngân hàng trực tiếp)

Chạy migration `20261026010000_account_premium` và `npm run prisma:generate`.

Đặt các biến ở backend, không đặt trong `NEXT_PUBLIC_*`:

```dotenv
SEPAY_BANK_CODE=
SEPAY_GATEWAY=
SEPAY_ACCOUNT_NUMBER=
SEPAY_ACCOUNT_HOLDER=
SEPAY_WEBHOOK_KEY=
```

`SEPAY_BANK_CODE` là mã/BIN ngân hàng SePay hỗ trợ. `SEPAY_GATEWAY` là tên ngân hàng đúng như trường `gateway` SePay gửi; nếu bỏ trống sẽ dùng cùng giá trị với `SEPAY_BANK_CODE`. Dùng đúng tài khoản đã kết nối SePay. Tạo khoá webhook ngẫu nhiên, giữ bí mật.

Trong SePay, tạo webhook tiền vào cho đúng tài khoản ngân hàng:

- URL: `https://<backend-domain>/api/membership/sepay/webhook`
- Authentication: API Key. Dùng cùng `SEPAY_WEBHOOK_KEY`.
- Content-Type: `application/json`.
- Tiền tố mã thanh toán: `SOMA`. Bật retry khi lỗi.
- Không bật bỏ qua giao dịch không có mã trích xuất: backend tự dò mã `SOMA` trong nội dung gốc và bỏ qua giao dịch không thuộc đơn hàng.

SePay gửi `Authorization: Apikey <key>`. Máy chủ kiểm tra khoá bằng so sánh thời gian hằng, tài khoản, hướng tiền vào, số tiền chính xác 25.000đ và mã đơn. Mã giao dịch có unique constraint; xác nhận đơn và cộng hạn Premium nằm trong cùng transaction. Trình duyệt chỉ đọc trạng thái, không thể tự đánh dấu đã trả tiền.

QR dùng mã đơn riêng, có số tiền và nội dung. Trang tài khoản kiểm tra trạng thái mỗi 4 giây khi đang mở đơn; đóng trang không mất đơn, bấm lại nâng cấp sẽ mở lại đơn chờ.

Phải dùng backend có HTTPS công khai để SePay gọi tới. `localhost` chỉ kiểm tra được bằng sự kiện mô phỏng; chưa xác nhận thanh toán thật cho tới khi đã thử một giao dịch thực nhận.

Tài liệu chính thức: https://developer.sepay.vn/en/sepay-webhooks/tich-hop-webhook và https://docs.sepay.vn/tao-qr-code-vietqr-dong.html.
