import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import type { AuthUser } from '../auth/roles';

const PAGE = 25;

/**
 * Vận hành: tình trạng hệ thống, hoạt động học tập, tài liệu cá nhân, phiên
 * đăng nhập.
 *
 * Tách khỏi `AdminService` (nội dung y khoa) và `AnatomyAdminService` (giải
 * phẫu) vì đây là nhóm câu hỏi khác hẳn: không phải "nội dung đúng chưa" mà là
 * "hệ thống đang chạy thế nào".
 */
@Injectable()
export class OpsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditService,
  ) {}

  // ------------------------------------------------------- tình trạng hệ thống

  /**
   * Những thứ có thể HỎNG mà không ai biết cho tới khi người dùng kêu.
   *
   * Kiểm cả những phụ thuộc NGOÀI cơ sở dữ liệu: chỉ số tri thức y khoa là một
   * tệp trên đĩa, khoá LLM là một biến môi trường. Cả hai hỏng thì trang vẫn
   * lên bình thường, chỉ có trợ lý im lặng trả về rỗng — đúng loại lỗi không ai
   * phát hiện ra.
   *
   * KHÔNG trả giá trị khoá, chỉ trả CÓ hay KHÔNG: một trang quản trị in khoá
   * API ra màn hình là một trang làm rò khoá API.
   */
  async system() {
    const started = Date.now();
    let db: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      db = 'down';
    }
    const dbLatencyMs = Date.now() - started;

    const indexPath =
      this.config.get<string>('MEDICAL_KB_INDEX') ||
      resolve(process.cwd(), '..', 'medical_kb', 'text', 'chunks.jsonl');
    const indexExists = existsSync(indexPath);
    const indexStat = indexExists ? statSync(indexPath) : null;

    const [pathologies, structures, users, sessions, auditRows, lastAudit] =
      await Promise.all([
        this.prisma.pathology.count(),
        this.prisma.structure.count(),
        this.prisma.user.count(),
        this.prisma.session.count({ where: { expiresAt: { gt: new Date() } } }),
        this.prisma.auditLog.count(),
        this.prisma.auditLog.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true },
        }),
      ]);

    return {
      database: { status: db, latencyMs: dbLatencyMs },
      medicalKb: {
        path: indexPath,
        exists: indexExists,
        bytes: indexStat?.size ?? 0,
        updatedAt: indexStat?.mtime.toISOString() ?? null,
      },
      /*
       * Khoá LLM nằm ở PHÍA WEB (Soma_Fe/.env.local), không phải ở backend —
       * mọi lời gọi mô hình đi qua route Next. Nói rõ điều đó thay vì báo
       * "chưa cấu hình", nếu không người quản trị sẽ đi sửa nhầm tệp.
       */
      llm: {
        managedBy: 'Soma_Fe (.env.local)',
        note: 'Backend không giữ khoá LLM; trợ lý gọi mô hình từ route Next.',
      },
      runtime: {
        node: process.version,
        uptimeSeconds: Math.round(process.uptime()),
        startedAt: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
      totals: { pathologies, structures, users, sessions, auditRows },
      lastAuditAt: lastAudit?.createdAt.toISOString() ?? null,
    };
  }

  // --------------------------------------------------------- hoạt động học tập

  /**
   * Số liệu học tập TỔNG HỢP, không phải hồ sơ từng người.
   *
   * Trang web hứa tiến độ học là của riêng người dùng. Quản trị cần biết hệ
   * thống có ai dùng không và phần nào đang khó, chứ không cần biết ai trả lời
   * sai câu nào — nên ở đây chỉ có tổng, trung bình và phân bố.
   */
  async learning() {
    const now = new Date();
    const since = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const [
      attempts,
      attempts30d,
      bySource,
      byScope,
      learners,
      paths,
      reviewItems,
      dueNow,
      lapsed,
      recent,
    ] = await Promise.all([
      this.prisma.quizAttempt.count(),
      this.prisma.quizAttempt.count({ where: { createdAt: { gte: since } } }),
      this.prisma.quizAttempt.groupBy({
        by: ['source'],
        _count: { _all: true },
        _sum: { score: true, total: true },
      }),
      this.prisma.quizAttempt.groupBy({
        by: ['scope'],
        _count: { _all: true },
        _sum: { score: true, total: true },
        orderBy: { _count: { scope: 'desc' } },
        take: 10,
      }),
      // Người ĐÃ TỪNG nộp bài, không phải tổng tài khoản: tài khoản đăng ký rồi
      // bỏ đó không nói lên điều gì về việc trang có được dùng hay không.
      this.prisma.quizAttempt
        .groupBy({ by: ['userId'] })
        .then((rows) => rows.length),
      this.prisma.studyPath.count(),
      this.prisma.reviewItem.count(),
      this.prisma.reviewItem.count({ where: { dueAt: { lte: now } } }),
      // `lapses > 0` = câu từng trả lời sai và bị kéo về ôn lại. Tỉ lệ này cao
      // nghĩa là nội dung khó hoặc đề sai, cả hai đều đáng xem.
      this.prisma.reviewItem.count({ where: { lapses: { gt: 0 } } }),
      this.prisma.quizAttempt.findMany({
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          source: true,
          scope: true,
          mode: true,
          score: true,
          total: true,
          seconds: true,
          createdAt: true,
        },
      }),
    ]);

    const rate = (sum: { score: number | null; total: number | null }) =>
      sum.total ? Math.round(((sum.score ?? 0) / sum.total) * 100) : null;

    return {
      attempts,
      attempts30d,
      learners,
      paths,
      review: { total: reviewItems, dueNow, lapsed },
      bySource: bySource.map((row) => ({
        source: row.source,
        attempts: row._count._all,
        accuracy: rate(row._sum),
      })),
      byScope: byScope.map((row) => ({
        scope: row.scope,
        attempts: row._count._all,
        accuracy: rate(row._sum),
      })),
      recent,
    };
  }

  // ---------------------------------------------------------- tài liệu cá nhân

  /**
   * Tài liệu PDF người dùng tải lên — CHỈ phần kê khai.
   *
   * Không trả `stem`, không trả phương án, không trả bất cứ chữ nào của tài
   * liệu. Trang web hứa "chỉ tài khoản của bạn truy cập"; cho quản trị đọc được
   * là phá lời hứa đó, và cái quản trị thật sự cần chỉ là "có bản nào bóc hỏng
   * không" — mà điều đó nằm ở `status`, không nằm ở nội dung.
   */
  async personalDocs(params: { status?: string; page?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const where = params.status ? { status: params.status } : {};

    const [items, total, byStatus] = await Promise.all([
      this.prisma.personalDoc.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          filename: true,
          bytes: true,
          pages: true,
          status: true,
          note: true,
          createdAt: true,
          user: { select: { email: true } },
          _count: { select: { questions: true } },
        },
      }),
      this.prisma.personalDoc.count({ where }),
      this.prisma.personalDoc.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const approved = await this.prisma.personalQuestion.groupBy({
      by: ['docId'],
      where: { docId: { in: items.map((d) => d.id) }, approved: true },
      _count: { _all: true },
    });
    const approvedBy = new Map(approved.map((r) => [r.docId, r._count._all]));

    return {
      items: items.map(({ _count, user, ...doc }) => ({
        ...doc,
        owner: user.email,
        questions: _count.questions,
        approved: approvedBy.get(doc.id) ?? 0,
      })),
      total,
      page,
      pageSize: PAGE,
      byStatus: byStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    };
  }

  // ------------------------------------------------------------ phiên đăng nhập

  /**
   * Phiên còn hiệu lực.
   *
   * KHÔNG trả `tokenHash`: nó là băm nhưng vẫn là bí mật của phiên, và một
   * trang quản trị chẳng có việc gì cần tới nó.
   */
  async sessions(params: { page?: number }) {
    const page = Math.max(1, params.page ?? 1);
    const where = { expiresAt: { gt: new Date() } };
    const [items, total] = await Promise.all([
      this.prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE,
        take: PAGE,
        select: {
          id: true,
          createdAt: true,
          expiresAt: true,
          user: { select: { id: true, name: true, email: true, role: true } },
        },
      }),
      this.prisma.session.count({ where }),
    ]);
    return { items, total, page, pageSize: PAGE };
  }

  async revokeSession(actor: AuthUser, id: string) {
    const session = await this.prisma.session.findUnique({
      where: { id },
      select: { id: true, user: { select: { id: true, email: true } } },
    });
    if (!session) throw new NotFoundException('Không có phiên này');
    await this.prisma.session.delete({ where: { id } });
    await this.audit.record({
      actor,
      action: 'delete',
      entity: 'session',
      entityId: id,
      entityLabel: session.user.email,
      before: { userEmail: session.user.email },
    });
    return { revoked: true, id, self: session.user.id === actor.id };
  }
}
