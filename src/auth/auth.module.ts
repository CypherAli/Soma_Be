import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { MailService } from './mail.service';
import { RolesGuard } from './roles.guard';

/**
 * `@Global`: `AuthGuard` được gắn rải rác ở mọi module nội dung (bệnh lý, cấu
 * trúc, hệ, loài, quiz…). Bắt từng module đó `imports: [AuthModule]` thì chỉ
 * cần quên MỘT lần là Nest ném lỗi phụ thuộc lúc khởi động — hoặc tệ hơn, người
 * sửa sẽ gỡ guard ra cho hết lỗi.
 */
@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, MailService, AuthGuard, RolesGuard],
  exports: [AuthService, MailService, AuthGuard, RolesGuard],
})
export class AuthModule {}
