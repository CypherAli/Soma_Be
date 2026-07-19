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
| `Collection` | Bộ sưu tập chuyên gia |

## Chạy local

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
| `collections` | CRUD bộ sưu tập chuyên gia |
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
