# Soma 3D — Backend API

API cho atlas giải phẫu 3D tương tác **Soma 3D**. Dữ liệu đa ngữ (Việt / Anh / Trung),
chuẩn thuật ngữ Terminologia Anatomica (TA2), thiết kế mở rộng cho cả người và thú y.

## Công nghệ

- **NestJS 11** (kiến trúc module hoá)
- **Prisma 7** ORM + **PostgreSQL** (qua driver adapter `@prisma/adapter-pg`)
- **Swagger / OpenAPI** — tài liệu API tương tác
- **class-validator** — kiểm tra dữ liệu đầu vào tự động

## Mô hình dữ liệu

| Model | Vai trò |
|-------|---------|
| `Species` | Loài (human, canine, feline...) — mở rộng thú y |
| `AnatomySystem` | Hệ cơ quan (xương, cơ, thần kinh...) |
| `Structure` | Cấu trúc giải phẫu, phân cấp cha/con, gắn mesh glTF |
| `Pathology` | Bệnh lý gắn vào cấu trúc — **bắt buộc có nguồn trích dẫn** |
| `QuizQuestion` / `QuizOption` | Câu hỏi trắc nghiệm theo hệ |

## Chạy local

Kho y khoa cục bộ nằm trong `resources/medical_kb/`: PDF nguồn, văn bản trích
xuất, hình và chỉ mục RAG. Kho giữ lịch sử Git riêng; corpus không đưa vào
repository backend hoặc Docker image. Backend mặc định đọc kho ở đây; có thể
đặt `MEDICAL_KB_ROOT`, `MEDICAL_KB_INDEX` hoặc `MEDICAL_ANATOMY_TEXT` để dùng
volume khác. `MEDICAL_DOCS_DIR` vẫn hỗ trợ thư mục PDF bổ sung.

```bash
# 1. Cài phụ thuộc
npm install

# 2. Tạo file .env từ mẫu, điền DATABASE_URL trỏ tới PostgreSQL của bạn
cp .env.example .env

# 3. Sinh Prisma client + tạo bảng
npm run prisma:generate
npm run prisma:migrate

# 4. Nạp dữ liệu mẫu (loài, hệ, cấu trúc, bệnh lý, trắc nghiệm)
npm run db:seed

# 5. Chạy server (mặc định cổng 4000)
npm run start:dev
```

- API gốc: `http://localhost:4000/api`
- Tài liệu Swagger: `http://localhost:4000/api/docs`
- Kiểm tra sức khoẻ: `http://localhost:4000/api/health`

## Nhóm endpoint

Mọi endpoint đều có tiền tố `/api`. Chi tiết đầy đủ xem tại `/api/docs`.

| Nhóm | Endpoint chính |
|------|----------------|
| `species` | `GET/POST /species`, `GET/PATCH/DELETE /species/:code` |
| `anatomy-systems` | `GET /anatomy-systems?species=`, `GET /anatomy-systems/:code` |
| `structures` | `GET /structures?system=&species=&q=`, `GET /structures/:code` |
| `pathologies` | `GET /pathologies?structure=`, CRUD theo `:id` |
| `quizzes` | `GET /quizzes?system=`, tạo câu hỏi kèm đáp án lồng nhau |
| `health` | Kiểm tra API + kết nối database |

## Nguyên tắc dữ liệu

Nội dung y khoa (bệnh lý, giải thích trắc nghiệm) **luôn kèm nguồn trích dẫn thật**
(Gray's Anatomy, Braunwald's, Sabiston...), không bịa. Dữ liệu cấu trúc khớp 1-1 với
các model 3D thật đã dựng ở frontend.

## Triển khai (Render)

```bash
npm run build
npm run prisma:deploy   # áp migration lên DB production
npm run start:prod
```

## Chạy cả ba ứng dụng bằng Docker

Từ thư mục `đồ án`:

```bash
docker compose -f soma_be/deploy/docker-compose.yml up --build -d
docker compose -f soma_be/deploy/docker-compose.yml ps
```

Compose chạy PostgreSQL, backend (4000), website (3000) và back office (3001).
Backend chỉ được đánh dấu sẵn sàng khi `/api/health` trả thành công; FE/BO sẽ
đợi trạng thái này. Lần đầu dùng một database trống, chạy seed **một lần** sau
khi backend healthy để có dữ liệu mẫu:

```bash
docker compose -f soma_be/deploy/docker-compose.yml exec be npm run db:seed
```

Nếu cần cổng API giới hạn cho ứng dụng mobile, bật profile `mobile` (cổng 8083):

```bash
docker compose -f soma_be/deploy/docker-compose.yml --profile mobile up --build -d
```

Profile này chỉ đóng gói **gateway API**. Bản Expo web trên laptop vẫn chạy
theo `Soma_App/README.md`; APK được build riêng và chạy trực tiếp trên Android,
không chạy bên trong container. Với demo local, địa chỉ gateway là
`http://127.0.0.1:8083/api`.

Kiểm tra sau khi khởi động: mở `http://localhost:4000/api/health`,
`http://localhost:3000`, `http://localhost:3001`; nếu bật profile mobile,
kiểm tra thêm `http://localhost:8083/api/health`. Xem log và dừng stack bằng:

```bash
docker compose -f soma_be/deploy/docker-compose.yml logs -f
docker compose -f soma_be/deploy/docker-compose.yml --profile mobile down
```

`down` giữ lại volume PostgreSQL và newsletter. Mật khẩu PostgreSQL trong Compose
chỉ dành cho demo local; khi triển khai công khai phải dùng bí mật riêng và cấu
hình địa chỉ HTTPS thật.

Mẫu cấu hình nằm trong `deploy/.env.compose.example`. Khi cần, sao chép thành
`deploy/.env` và điền cấu hình thật. Compose mount kho y khoa và chỉ mục bệnh
lý ở chế độ chỉ đọc; không chép corpus vào image. Nếu thiếu PDF nguồn thì
chuẩn bị tệp trong `resources/medical_kb/sources/` hoặc cấu hình volume bổ sung.

Các công cụ biên soạn nằm trong `resources/medical_kb/scripts/`; từ backend
có thể chạy `python resources/medical_kb/scripts/search_kb.py appendicitis`.
`npm run kb:sync` vẫn dùng để đồng bộ danh mục nguồn khi chủ động cập nhật dữ liệu.
