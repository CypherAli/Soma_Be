# Kiểm tra database và luồng tài khoản — 14/10/2026

## Kết quả đã xác minh

- PostgreSQL thật trả `db: up` qua `/api/health` sau khi backend được build và khởi động lại.
- 22/22 kiểm tra database đạt: bảng/cột/kiểu/nullability so với Prisma, index, migration, khóa ngoại và các ràng buộc dữ liệu của tài khoản, đề cá nhân, lịch ôn, lộ trình, cấu trúc giải phẫu.
- 15/15 migration đã áp dụng, 20 khóa ngoại hợp lệ, không có bản ghi mồ côi hoặc index lỗi. Kết quả chi tiết trong `database-audit.json`.
- Database có hai tài khoản đang được bật. Sau khi người dùng đăng nhập và cung cấp thông tin tài khoản, đã kiểm tra bằng tài khoản Trịnh Việt Hoàng qua đăng nhập bình thường. Kiểm kê cuối có một phiên browser còn hiệu lực và tám phiên cũ hết hạn; các phiên CLI của QA đã đăng xuất riêng, giữ phiên browser của người dùng.
- Dữ liệu hiện hữu được giữ nguyên: hai tài liệu cá nhân, 20 câu cá nhân, ba lượt làm bài, 37 mục ôn tập và hai lộ trình. Đã so sánh toàn bộ bản ghi học tập trước/sau bằng snapshot và SHA-256, không chỉ so sánh số lượng. Lộ trình/bộ nhớ chat gốc được sao lưu trong bộ nhớ rồi khôi phục sau test API, kèm kiểm tra chống ghi đè thay đổi đồng thời. Chỉ dọn tài liệu/câu hỏi/lượt làm bài/lịch ôn thử có ID xác định. Không tạo tài khoản, sửa mật khẩu hoặc cấp quyền.
- Backend: 84/84 unit test, 19/19 HTTP test đạt; lint và build thành công. HTTP test dùng AppModule và mock persistence. Bộ kiểm tra riêng qua API localhost với PostgreSQL thật đã chạy lại đạt **38/38**, kết quả trong `authenticated-api-qa.json`.
- Frontend: 66 unit test đạt trong báo cáo kiểm tra chức năng, lint và build thành công; production quét 925 URL, 273 tài nguyên, sáu URL 404 chủ đích, không có lỗi; 26/26 kiểm tra API production đạt với provider thử cục bộ.

## Lỗi đã sửa

1. Xóa tài liệu, câu hỏi hoặc lộ trình từng có thể khiến giao diện coi như đã xóa dù request thất bại. Giao diện hiện chỉ bỏ dữ liệu sau khi máy chủ xác nhận; lỗi mạng/server được hiển thị. Test hồi quy xác minh lỗi 503, lỗi mạng, 401 và URL DELETE lộ trình.
2. Xóa tài liệu/câu hỏi hoặc bỏ duyệt câu cá nhân từng không dọn mục ôn tập tương ứng. Backend hiện xử lý thay đổi và dọn lịch ôn trong cùng giao dịch, giới hạn theo chủ sở hữu và ID câu hỏi. Bảy test hồi quy xác minh phạm vi chủ sở hữu, bỏ duyệt, giữ lịch khi câu vẫn được duyệt và lỗi giao dịch.
3. Duyệt hàng loạt tài liệu không tồn tại từng trả thành công với số câu bằng 0. API hiện xác minh tài liệu thuộc tài khoản và trả 404 khi không tồn tại hoặc thuộc người khác.
4. API từng nhận lượt làm bài không có câu hoặc âm thầm hạ điểm vượt tổng. Hiện từ chối tổng ngoài 1–500, điểm ngoài 0–tổng và dữ liệu không nguyên bằng lỗi 400.
5. Nhiều dạng câu hỏi cùng kiểm tra một cấu trúc có thể đẩy lịch ôn hai lần trong một lượt. Hiện gộp theo mã câu, cập nhật lịch đúng một lần; nếu có câu trả lời sai thì cấu trúc đó vẫn cần ôn.
6. Mã câu cá nhân không tồn tại/chưa duyệt/thuộc người khác có thể tạo mục ôn mồ côi. Hiện kiểm tra chủ sở hữu và trạng thái duyệt trước khi ghi lượt làm bài trong giao dịch; mã nguồn giả cũng bị từ chối.
7. Đồng hồ thi lấy số câu đã nhớ thay vì số câu thực tế của ngân hàng nhỏ. UI thực tế tái hiện 2 câu nhưng bắt đầu 7:30; sau sửa bắt đầu đúng 1:30 (45 giây/câu), các nút công cụ được khóa khi đang làm và mở lại sau nộp/thoát.

## Luồng tài khoản đã kiểm tra

- Upload PDF và Word .docx qua HTTP thật: mỗi fixture tách đúng hai câu, giữ đáp án A/B và trạng thái chờ duyệt; câu chưa duyệt không vào ngân hàng làm bài. Tệp không được hỗ trợ bị từ chối.
- Sửa câu, từ chối đáp án không tồn tại, duyệt một câu/hàng loạt, nạp ngân hàng, ghi điểm 1/2 và lịch ôn đúng/sai, bỏ duyệt, xóa câu, xóa tài liệu, cascade/dọn lịch ôn được đối chiếu bằng SQL sau mỗi bước.
- Kiểm tra đọc tài liệu tài khoản khác trả 404; không sửa hoặc xóa tài liệu hiện hữu của tài khoản khác. Kiểm tra mã câu tài khoản khác/chưa duyệt bị từ chối trước khi ghi lịch ôn.
- Lộ trình: đọc lộ trình/ôn đến hạn hiện hữu, lưu kế hoạch một năm thử, bung tháng thành tuần, xóa kế hoạch thử rồi khôi phục bản ghi gốc gồm ID và thời gian. UI đọc lại đúng lộ trình cũ và bung tuần thành từng ngày.
- Bộ nhớ chat: lưu 42 lượt thử, server giữ đúng 40 lượt cuối, đọc lại khớp database, xóa bộ nhớ thử và khôi phục trạng thái gốc.
- Quyền quản trị: các API system, learning, personal-docs và review-queue đọc được bằng tài khoản hiện hữu. Không thử sửa nội dung chuyên môn, khóa tài khoản hoặc thay đổi quyền.
- Browser: mở tài liệu thử đã upload, sửa nội dung, duyệt hai câu, chuyển sang nguồn Đề của tôi, thi hai câu với đáp án bị ẩn trước nộp, chấm 50% (1/2), xác minh lượt làm bài và hai kết quả ôn đúng/sai trong PostgreSQL. Bài thử tiếp theo dùng để xác minh đồng hồ đã thoát mà không nộp; không phát sinh lượt làm bài thừa. Bằng chứng: `authenticated-ui-data.json`, ảnh `Soma_Fe/docs/audits/authenticated-quiz-result.png` và `authenticated-quiz-timer.png`.

## Phần chưa thể xác minh

File chooser của IAB không phát sự kiện cho công cụ ở lượt kiểm tra này; upload đã được kiểm tra bằng multipart HTTP thật, phần duyệt/làm bài được thao tác qua browser. Chưa thể tính việc chọn tệp qua hộp thoại của trình duyệt là đã được kiểm chứng tự động. Chưa thử OAuth, đổi mật khẩu, gửi email, quản trị ghi dữ liệu chuyên môn hoặc thu hồi phiên của người dùng.

Theo xác nhận trực tiếp của chủ website, đã ghi nhận duyệt 106 bài qua API quản trị và 106 bản ghi audit; còn 0 bài chờ duyệt. SHA-256 nội dung/trích dẫn/nguồn trước và sau khớp. Đây là xác nhận của chủ website, không ghi thành thẩm định y khoa độc lập; cờ xác minh nguồn không đổi. Bằng chứng: `owner-content-approval.json`.

Đã diễn tập backup/restore PostgreSQL vào database thử riêng: 22 bảng và 20 khóa ngoại khớp, dump và database thử đã dọn (`backup-restore-qa.json`). Kiểm tra tải đọc 100 request/20 đồng thời không lỗi, p95 1086 ms trên máy cục bộ (`read-load-qa.json`); không thay thế kiểm tra tải production lớn. SMTP kết nối/xác thực đạt, không gửi email hoặc đổi mật khẩu thật. Micro IAB khởi động rồi dịch vụ nhận giọng nói trả `network`; đã xử lý lỗi giao diện nhưng chưa xác minh phiên âm người thật. Báo cáo cập nhật đầy đủ: `Soma_Fe/docs/audits/microphone-search-models-final-2026-10-14.md`.

## Chạy lại

Tại `soma_be`, chạy `node scripts/audit-database.mjs`. Script sử dụng giao dịch `REPEATABLE READ READ ONLY`, giới hạn thời gian từng truy vấn, ghi báo cáo tổng hợp và không xuất mật khẩu, token, email hoặc nội dung cá nhân. Chạy `npm test -- --runInBand` và `npm run test:e2e -- --runInBand` để chạy kiểm tra hồi quy.

`scripts/qa-authenticated.mjs` cần thông tin tài khoản có sẵn qua biến môi trường `SOMA_QA_EMAIL`/`SOMA_QA_PASSWORD`; không có mật khẩu hay token trong source/báo cáo. Các fixture là nội dung đánh dấu thử, không phải câu hỏi giải phẫu. Script chỉ gọi localhost, đăng xuất phiên riêng sau test và kiểm tra khôi phục dữ liệu cũ. `qa-account-ui-data.mjs` chuẩn bị, xác minh và dọn chính xác dữ liệu thử phục vụ thao tác browser.
