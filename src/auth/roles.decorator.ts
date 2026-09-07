import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

export const MIN_ROLE_KEY = 'minRole';

/**
 * Yêu cầu bậc quyền tối thiểu cho một endpoint hoặc cả controller.
 *
 * Gắn luôn cả hai guard và nhãn Swagger trong một decorator: tách ra thì sẽ có
 * ngày ai đó viết `@MinRole(...)` mà quên `@UseGuards(AuthGuard)` — endpoint
 * trông như đã khoá mà thực ra mở toang, đúng kiểu lỗi không ai nhìn ra khi
 * đọc lại code.
 */
export const MinRole = (role: UserRole) =>
  applyDecorators(
    SetMetadata(MIN_ROLE_KEY, role),
    UseGuards(AuthGuard, RolesGuard),
    ApiBearerAuth(),
  );
