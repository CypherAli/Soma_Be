# Soma 3D — Backend (Soma_Be)

> API + cơ sở dữ liệu cho nền tảng giải phẫu 3D **Soma 3D**.
> Frontend: [Soma_Fe](https://github.com/CypherAli/Soma_Fe).

## Công nghệ

NestJS · Prisma · PostgreSQL · TypeScript

## Mô hình dữ liệu

Xem [`prisma/schema.prisma`](./prisma/schema.prisma):

- **Species** — loài (người, chó...), mở rộng sang thú y
- **AnatomySystem** — hệ cơ quan
- **Structure** — cấu trúc giải phẫu (phân cấp cha/con, gắn mesh glTF, tên đa ngữ + Latin/TA2)
- **Pathology** — bệnh lý gắn cấu trúc, kèm nguồn trích dẫn + mã ICD-11
- **QuizQuestion / QuizOption** — trắc nghiệm theo hệ
- **Collection** — bộ sưu tập chuyên gia

## Chạy dự án

```bash
npm install
cp .env.example .env      # điền DATABASE_URL
npx prisma migrate dev     # tạo bảng
npm run start:dev          # chạy API
```

## Ghi chú

- Dữ liệu đa ngữ: mỗi tên có 3 cột `vi/en/zh` + `latin`.
- Deploy dự kiến trên Render.
