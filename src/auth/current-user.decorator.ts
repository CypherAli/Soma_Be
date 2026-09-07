import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { AuthUser, AuthedRequest } from './roles';

/**
 * Người dùng của request hiện tại.
 *
 * Chỉ dùng được sau [AuthGuard]; không có guard thì trả `undefined` chứ không
 * ném lỗi, để các endpoint công khai vẫn nhận diện được người đăng nhập khi có.
 */
export const CurrentUser = createParamDecorator(
  (_: unknown, context: ExecutionContext): AuthUser | undefined =>
    context.switchToHttp().getRequest<AuthedRequest>().user,
);
