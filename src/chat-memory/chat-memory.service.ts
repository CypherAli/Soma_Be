import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

export type Turn = { role: 'user' | 'bot'; text: string };

/**
 * Bộ nhớ hội thoại của trợ lý, gắn theo TÀI KHOẢN.
 *
 * Trước đây lịch sử chỉ nằm ở localStorage: đổi máy là mất, xoá cache là mất,
 * và không có cách nào để trợ lý nhớ người dùng đã hỏi gì ở buổi trước.
 */
@Injectable()
export class ChatMemoryService {
  /** Giữ 40 lượt gần nhất. Đủ để nối mạch nhiều buổi mà một tài khoản không
      phình vô hạn — trợ lý cũng chỉ đọc vài lượt cuối khi trả lời. */
  private static readonly MAX_TURNS = 40;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private async userIdOf(token?: string) {
    const me = await this.auth.me(token).catch(() => null);
    if (!me) throw new UnauthorizedException('Cần đăng nhập');
    return me.user.id;
  }

  async get(token?: string): Promise<{ turns: Turn[] }> {
    const userId = await this.userIdOf(token);
    const row = await this.prisma.chatMemory.findUnique({ where: { userId } });
    return { turns: (row?.turns as Turn[]) ?? [] };
  }

  async save(turns: Turn[], token?: string): Promise<{ turns: Turn[] }> {
    const userId = await this.userIdOf(token);
    // Cắt ở MÁY CHỦ, không tin số lượng phía web gửi lên.
    const clean = (Array.isArray(turns) ? turns : [])
      .filter(
        (t) =>
          t &&
          (t.role === 'user' || t.role === 'bot') &&
          typeof t.text === 'string',
      )
      .map((t) => ({ role: t.role, text: t.text.slice(0, 4000) }))
      .slice(-ChatMemoryService.MAX_TURNS);

    await this.prisma.chatMemory.upsert({
      where: { userId },
      create: { userId, turns: clean },
      update: { turns: clean },
    });
    return { turns: clean };
  }

  async clear(token?: string) {
    const userId = await this.userIdOf(token);
    await this.prisma.chatMemory.deleteMany({ where: { userId } });
    return { success: true };
  }
}
