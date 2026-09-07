import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthedRequest } from './roles';

/**
 * Bắt buộc có phiên đăng nhập hợp lệ, và gắn người dùng vào request.
 *
 * Trước đây mỗi controller tự bóc chuỗi "Bearer " rồi truyền token xuống
 * service — lặp ở bốn nơi, và ba nhóm endpoint GHI thì quên hẳn, tức là ai
 * cũng sửa/xoá được bệnh lý bằng một lệnh curl. Gom về một guard thì việc
 * "endpoint này có khoá chưa" đọc được ngay trên khai báo controller.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<AuthedRequest & { headers: Record<string, string> }>();
    const header = request.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : undefined;
    const user = await this.auth.userFromToken(token);
    if (!user) {
      throw new UnauthorizedException(
        'Phiên đăng nhập không hợp lệ hoặc đã hết hạn',
      );
    }
    request.user = user;
    return true;
  }
}
