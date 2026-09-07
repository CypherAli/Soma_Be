import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Tiền tố chung cho mọi API — FE gọi qua /api/...
  app.setGlobalPrefix('api');

  // Cho phép FE (cổng khác) gọi API.
  app.enableCors({ origin: true, credentials: true });

  // Kiểm tra dữ liệu vào tự động theo DTO + class-validator.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // loại field không khai báo trong DTO
      forbidNonWhitelisted: true, // báo lỗi nếu gửi field lạ
      transform: true, // ép kiểu theo DTO (string -> number...)
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Tài liệu API tương tác (Swagger UI) tại /api/docs.
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Soma 3D API')
    .setDescription(
      'API atlas giải phẫu 3D tương tác — dữ liệu đa ngữ Việt/Anh/Trung, ' +
        'chuẩn thuật ngữ Terminologia Anatomica (TA2).',
    )
    .setVersion('1.0')
    .addTag('species', 'Loài (người, thú y)')
    .addTag('anatomy-systems', 'Hệ cơ quan')
    .addTag('structures', 'Cấu trúc giải phẫu (gắn model 3D)')
    .addTag('pathologies', 'Bệnh lý (kèm nguồn trích dẫn)')
    .addTag('quizzes', 'Câu hỏi trắc nghiệm')
    .addTag('health', 'Kiểm tra tình trạng hệ thống')
    .addTag('study', 'Tiến độ học: lượt làm bài, lộ trình, hàng đợi ôn')
    .addTag('personal-docs', 'Tài liệu cá nhân và bộ đề riêng')
    .addTag('admin', 'Back office: quản trị nội dung, tài khoản, nhật ký')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);

  console.log(
    `Soma 3D API chạy tại http://localhost:${port}/api — tài liệu: /api/docs`,
  );
}
// `void`: bootstrap là promise chạy suốt vòng đời tiến trình, không ai await.
void bootstrap();
