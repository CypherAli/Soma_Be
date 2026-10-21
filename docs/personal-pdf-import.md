# Nhập đề PDF cá nhân

Backend cần Python 3 có PyMuPDF và Pillow:

Dockerfile đã cài bộ đọc trong môi trường Python riêng, đặt `PDF_PYTHON_BIN` và mang `extract.py` vào image chạy. Với máy chạy Node trực tiếp, thực hiện các lệnh sau.

```powershell
python -m pip install -r scripts/pdf_quiz/requirements.txt
npx prisma migrate deploy
npx prisma generate
npm run build
```

`PDF_PYTHON_BIN` có thể đặt thành đường dẫn tuyệt đối của Python; mặc định gọi `python` trên PATH. Khi triển khai, giữ thư mục `scripts/pdf_quiz` cạnh `dist` và `resources`. Không tải thư viện Python lúc có yêu cầu. Thiếu bộ đọc thì trả lỗi, không báo đã nhập vài câu như thể toàn bộ đề hoàn chỉnh.

`document-reader.ts` gửi bytes PDF qua stdin cho `scripts/pdf_quiz/extract.py`. Không ghi PDF gốc ra đĩa. Bộ đọc bố cục trích câu `Câu hỏi N:`, các nhãn phương án A–F, khóa màu xanh và khóa viết rõ, hình và lời giải. Nó giữ thứ tự block của PDF, xử lý khung phương án bị ngắt trang và bỏ vùng header/footer của bản in trình duyệt. PDF không khớp dạng bố cục này tiếp tục qua bộ đọc văn bản; PDF chỉ chứa ảnh cần OCR từ trước.

Hình được chuyển WebP và lưu trong `personal_questions` cùng với câu, dưới dạng data URL. API đọc/sửa/duyệt tiếp tục kiểm tra chủ tài liệu bằng token. Không thêm ảnh hay đề tải lên vào thư viện công khai. Giới hạn: 50 MB tệp, 600 trang, 1000 câu, 120 giây xử lý và 96 MB kết quả. Các câu thiếu khóa, thiếu nội dung hoặc khóa mâu thuẫn vẫn hiện để đối chiếu; duyệt hàng loạt bỏ qua các câu này. Không suy ra khóa từ kiến thức y khoa hay lời giải.

Kiểm tra:

```powershell
python scripts/pdf_quiz/test_extract.py
npx jest --runInBand src/personal-docs
```

Fixture gồm các trang trích từ PDF người dùng cung cấp, kiểm tra khóa màu, ảnh lời giải, phương án vắt qua ngắt trang, chân trang trình duyệt và câu bị cắt thiếu. File đầy đủ `Giải phẫu người 2025 - Test số hóa Dr. Lâm.pdf` ngày 22/10/2026 đã kiểm tra trực tiếp: 113 trang, 152 câu, 152 khóa đọc được, 28 hình lời giải; câu 71 không còn nội dung chân trang trong phương án B.
