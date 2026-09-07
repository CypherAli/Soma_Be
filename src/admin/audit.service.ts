import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthUser } from '../auth/roles';

/** Số bản ghi nhật ký trả về mỗi trang. */
const PAGE = 50;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ghi một thao tác quản trị.
   *
   * KHÔNG để lỗi ghi nhật ký làm hỏng thao tác chính: người quản trị vừa sửa
   * xong một bệnh mà nhận về lỗi 500 sẽ bấm sửa lại lần nữa, và lần này mới là
   * lần thật sự hỏng dữ liệu. Nhật ký hụt một dòng thì còn vá được.
   */
  async record(input: {
    actor: AuthUser;
    action: string;
    entity: string;
    entityId: string;
    entityLabel?: string | null;
    before?: unknown;
    after?: unknown;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorId: input.actor.id,
          actorEmail: input.actor.email,
          action: input.action,
          entity: input.entity,
          entityId: input.entityId,
          entityLabel: input.entityLabel ?? null,
          before: input.before ?? Prisma.JsonNull,
          after: input.after ?? Prisma.JsonNull,
        },
      });
    } catch (error) {
      console.error('Không ghi được nhật ký quản trị:', error);
    }
  }

  async list(params: { entity?: string; actorEmail?: string; page?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const where: Prisma.AuditLogWhereInput = {
      entity: params.entity || undefined,
      actorEmail: params.actorEmail || undefined,
    };
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE,
        take: PAGE,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE };
  }
}
