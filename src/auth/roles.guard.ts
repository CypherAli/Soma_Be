import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { MIN_ROLE_KEY } from './roles.decorator';
import { hasAtLeast, type AuthedRequest } from './roles';

/** Chặn theo bậc quyền tối thiểu do [MinRole] khai. Chạy SAU [AuthGuard]. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const minimum = this.reflector.getAllAndOverride<UserRole | undefined>(
      MIN_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!minimum) return true;
    const user = context.switchToHttp().getRequest<AuthedRequest>().user;
    if (!user || !hasAtLeast(user.role, minimum)) {
      throw new ForbiddenException('Tài khoản không đủ quyền cho thao tác này');
    }
    return true;
  }
}
