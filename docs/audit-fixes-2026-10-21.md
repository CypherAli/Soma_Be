Đã cập nhật dependency trong phạm vi khai báo, vá js-yaml của Swagger, sinh lại Prisma Client 7.10.1. Không đổi schema hoặc áp migration. Audit production còn 3 moderate ở chuỗi mammoth/argparse/sprintf-js; guard width/precision được cài lại qua postinstall và có test:security. Không hạ mammoth theo gợi ý sửa tự động.

POST /study/attempts nhận UUID, source/scope/mode/seconds và answers gồm questionId/answerId. Máy chủ chấm từ CMS đã xuất bản hoặc câu cá nhân đã duyệt thuộc đúng user; từ chối điểm tự khai báo, câu/phương án lạ, trùng câu và lệch scope. Retry cùng UUID/payload trả biên nhận cũ. Đã đối chiếu 3.930 biến thể câu mô hình, 257 câu giáo trình và 43 câu atlas.

GET OAuth không nhận token liên kết trong query; dùng POST /auth/oauth/:provider/link có Bearer. Mobile đọc asset tương đối hoặc URL thuộc API origin được cấu hình, không tải URL tùy ý. Compose bổ sung backend nội bộ, build args public URL và volume newsletter.

Kiểm tra đạt: build/lint, 163 unit test và 22 HTTP test; 5/5 viewer mobile. Docker daemon không chạy nên chỉ xác nhận cú pháp Compose, chưa nghiệm thu toàn stack. Triển khai cùng FE mới và catalog đồng bộ. npm run test:security kiểm chứng guard cục bộ.
