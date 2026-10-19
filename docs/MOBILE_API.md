# Soma Mobile API v1

Module `src/mobile` bổ sung API cho app Android, dùng chung AuthService, ContentService và StudyService của web. Prefix hiện có: `/api`. Các endpoint tài khoản/lộ trình/lịch sử giữ nguyên.

| Endpoint | Quyền | Mục đích |
|---|---|---|
| `GET /mobile/bootstrap` | Công khai | `schemaVersion: 1`, checksum nội dung, năm mô hình và câu hỏi có version |
| `GET /mobile/due` | Bearer token | Lọc câu đến hạn theo kho mobile trước khi giới hạn số lượng; câu từ kho web khác không đẩy câu mobile khỏi hàng ôn |
| `GET /mobile/models/:id/file` | Công khai | GLB trong danh sách cho phép; hỗ trợ GLB thay thế đã xuất bản qua CMS |
| `GET /mobile/viewer/:id?theme=dark` | Công khai | HTML viewer 3D có CSP; không chứa token tài khoản |
| `GET /mobile/runtime/:filename` | Công khai | Chỉ viewer.js và ba tài nguyên Draco được liệt kê |
| `POST /mobile/attempts` | Bearer token | Máy chủ chấm bài và ghi một lần theo UUID phía app |

Ví dụ payload nộp bài (lấy mã/version/option thật từ bootstrap):

```json
{
  "clientRequestId": "00000000-0000-4000-8000-000000000001",
  "scope": "skeletal",
  "seconds": 90,
  "answers": [
    { "itemKey": "model:ban-tay/<hotspot-key>", "version": "<SHA-256 của câu>", "answerId": "<option-id>" }
  ]
}
```

Một lượt có 1–20 câu, `scope` là `all` hoặc hệ phù hợp, thời lượng 0–21600 giây. App không gửi điểm tự chấm. Các câu phải có phiên bản hiện hành và đáp án hợp lệ. Câu trùng bị từ chối. Nội dung đã thay đổi/gỡ trả 409 để app giữ bản nháp và báo cho người học.

Khóa duy nhất `(userId, clientRequestId)` và fingerprint payload ngăn ghi trùng khi retry hoặc gửi đồng thời. Cùng UUID/cùng payload trả lại lượt cũ; cùng UUID/khác payload trả 409. Receipt cũ vẫn có thể lấy lại khi nội dung đã cập nhật. `requestFingerprint` chỉ được truyền giữa các service, không nhận từ DTO công khai. Endpoint ghi lượt cũ của web vẫn hỗ trợ payload không có UUID.

Item key dùng `model:<scene-slug>/<hotspot-key>`, khớp mã câu đang được web dùng. Lượt mobile xuất hiện trong `/study/history`; lịch ôn và lộ trình sử dụng các bảng hiện có.

## Chuẩn bị triển khai

1. Trong `Soma_App`: `npm ci` rồi `npm run prepare:backend`. Lệnh tạo `resources/mobile` của backend từ năm GLB, Draco và nguồn viewer; giữ thư mục này trong gói/container triển khai.
2. Trong backend: `npx prisma generate`, `npx prisma migrate deploy`, `npm run build`.
3. `npm run start:prod`. Có thể đặt `MOBILE_ASSETS_DIR` thành đường dẫn tuyệt đối nếu không dùng `resources/mobile` tương đối với working directory.

Migration thêm hai cột nullable của QuizAttempt và unique index; dữ liệu lượt cũ không bị xóa. Đối chiếu migration đang chờ của môi trường trước khi deploy theo quy trình của dự án. Cấu hình HTTPS khi kết nối bản production của app.

Nguồn nội dung là bản xuất bản CMS, có fallback từ catalog định nghĩa giống web. Thay thế mô hình cần giữ tên node khớp chú giải. Tệp mô hình khác tên hoặc thiếu tài nguyên được báo lỗi thay vì đọc một đường dẫn tùy ý. Phạm vi mobile chỉ gồm năm slug trong `MOBILE_MODELS`.

## Xác minh

Unit tests: `mobile.catalog.spec.ts`, `study/idempotency.spec.ts`, cùng các test DTO/StudyService hiện có. `node scripts/qa-mobile.mjs` chạy với server và DB phát triển để kiểm tra chấm 9/10, gửi đồng thời, xung đột UUID, câu đã sửa, tách tài khoản, lịch sử chung và item key lịch ôn. Script chỉ xóa các tài khoản test tự tạo, theo cả id và email.
