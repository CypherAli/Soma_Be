import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { INITIAL_REVIEW, nextReview, questionsForMinutes } from './review';
import { buildPlan, expandBlock, type PlanInput } from './plan';

export type GradedItem = {
  itemKey: string;
  source: string;
  scope?: string;
  correct: boolean;
};

export type AttemptInput = {
  clientRequestId?: string;
  /** Internal server fingerprint for a validated mobile answer payload. Not accepted by the public DTO. */
  requestFingerprint?: string;
  source: string;
  scope?: string;
  mode?: string;
  score: number;
  total: number;
  seconds?: number;
  items?: GradedItem[];
};

export type PathInput = {
  goal: string;
  daysPerWeek: number;
  minutesPerDay: number;
  systemKey?: string;
  horizonDays?: number;
  focusSystems?: string[];
  brief?: string;
};

/**
 * Tiến độ học: lượt làm bài, lộ trình, hàng đợi ôn theo khoảng cách.
 *
 * Mọi thứ ở đây gắn theo TÀI KHOẢN — cùng lý do với `ChatMemoryService`: học
 * trên máy ở trường rồi về nhà mở máy khác thì tiến độ phải còn nguyên. Phía
 * web vẫn lưu tạm lượt làm bài vào localStorage khi chưa đăng nhập, nhưng lộ
 * trình thì bắt buộc đăng nhập vì nó là dữ liệu nhiều buổi.
 */
@Injectable()
export class StudyService {
  /** Trả về nhiều nhất bấy nhiêu lượt gần đây cho màn lịch sử. */
  private static readonly MAX_HISTORY = 60;
  /** Trần số câu một buổi, kể cả khi hàng đợi đến hạn dài hơn. */
  private static readonly MAX_SESSION = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private async userIdOf(token?: string) {
    const me = await this.auth.me(token).catch(() => null);
    if (!me) throw new UnauthorizedException('Cần đăng nhập');
    return me.user.id;
  }

  // ---------------------------------------------------------------- lượt làm bài

  /**
   * Ghi một lượt đã nộp, đồng thời cập nhật lịch ôn cho từng câu trong lượt đó.
   *
   * Làm CẢ HAI trong một lần gọi (và một giao dịch) chứ không tách thành hai
   * API: tách ra thì mạng rớt giữa chừng sẽ có lượt đã ghi mà lịch ôn không
   * đổi, và người học ôn lại đúng những câu vừa trả lời đúng.
   */
  async recordAttempt(input: AttemptInput, token?: string) {
    const userId = await this.userIdOf(token);
    if (
      !Number.isInteger(input.total) ||
      input.total < 1 ||
      input.total > 500 ||
      !Number.isInteger(input.score) ||
      input.score < 0 ||
      input.score > input.total
    ) {
      throw new BadRequestException('Điểm và tổng số câu không hợp lệ');
    }
    const total = clampInt(input.total, 0, 500);
    const score = clampInt(input.score, 0, total);
    const now = new Date();

    const submitted = (Array.isArray(input.items) ? input.items : [])
      .filter((i) => i && typeof i.itemKey === 'string' && i.itemKey.length > 0)
      .slice(0, 500);
    const byKey = new Map<string, GradedItem>();
    for (const item of submitted) {
      if (
        !item.itemKey.startsWith(`${item.source}:`) ||
        item.itemKey.length <= item.source.length + 1
      ) {
        throw new BadRequestException('Mã câu hỏi không khớp nguồn đề');
      }
      // Different question formats may test the same model fact. Schedule that
      // fact once; any wrong response means it still needs review.
      const previous = byKey.get(item.itemKey);
      byKey.set(item.itemKey, {
        ...item,
        correct: previous ? previous.correct && item.correct : item.correct,
      });
    }
    const graded = [...byKey.values()];

    const requestFingerprint = input.clientRequestId
      ? (input.requestFingerprint ??
        createHash('sha256')
          .update(
            JSON.stringify({
              source: input.source,
              scope: input.scope ?? 'all',
              mode: input.mode === 'exam' ? 'exam' : 'practice',
              score,
              total,
              seconds: clampInt(input.seconds ?? 0, 0, 60 * 60 * 6),
              items: [...graded].sort((a, b) =>
                a.itemKey.localeCompare(b.itemKey),
              ),
            }),
          )
          .digest('hex'))
      : undefined;
    const existingAttempt = async () => {
      if (!input.clientRequestId) return null;
      const existing = await this.prisma.quizAttempt.findUnique({
        where: {
          userId_clientRequestId: {
            userId,
            clientRequestId: input.clientRequestId,
          },
        },
      });
      if (existing && existing.requestFingerprint !== requestFingerprint) {
        throw new ConflictException(
          'Mã lượt nộp đã được dùng cho một bài làm khác',
        );
      }
      return existing;
    };
    const previousAttempt = await existingAttempt();
    if (previousAttempt) return previousAttempt;

    try {
      const attempt = await this.prisma.$transaction(async (tx) => {
        const personalIds = graded
          .filter((item) => item.source === 'personal')
          .map((item) => item.itemKey.slice('personal:'.length));
        if (personalIds.length) {
          const available = await tx.personalQuestion.findMany({
            where: { id: { in: personalIds }, userId, approved: true },
            select: { id: true },
          });
          if (available.length !== personalIds.length) {
            throw new BadRequestException(
              'Câu cá nhân không tồn tại hoặc chưa được duyệt',
            );
          }
        }
        const created = await tx.quizAttempt.create({
          data: {
            userId,
            source: String(input.source ?? 'model').slice(0, 32),
            scope: String(input.scope ?? 'all').slice(0, 120),
            mode: input.mode === 'exam' ? 'exam' : 'practice',
            score,
            total,
            seconds: clampInt(input.seconds ?? 0, 0, 60 * 60 * 6),
            ...(input.clientRequestId
              ? { clientRequestId: input.clientRequestId, requestFingerprint }
              : {}),
          },
        });

        for (const item of graded) {
          const key = item.itemKey.slice(0, 200);
          const prev = await tx.reviewItem.findUnique({
            where: { userId_itemKey: { userId, itemKey: key } },
          });
          const next = nextReview(prev ?? INITIAL_REVIEW, item.correct, now);
          await tx.reviewItem.upsert({
            where: { userId_itemKey: { userId, itemKey: key } },
            create: {
              userId,
              itemKey: key,
              source: String(item.source ?? input.source ?? 'model').slice(
                0,
                32,
              ),
              scope: String(item.scope ?? input.scope ?? 'all').slice(0, 120),
              ...next,
              lastAt: now,
            },
            update: { ...next, lastAt: now },
          });
        }

        return created;
      });

      return attempt;
    } catch (error) {
      // The unique constraint arbitrates simultaneous retries across processes.
      if (
        input.clientRequestId &&
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const repeated = await existingAttempt();
        if (repeated) return repeated;
      }
      throw error;
    }
  }

  /** Lịch sử làm bài + vài con số tổng để dựng màn tiến độ. */
  async history(token?: string) {
    const userId = await this.userIdOf(token);
    const attempts = await this.prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: StudyService.MAX_HISTORY,
    });

    const totals = attempts.reduce(
      (acc, a) => ({ score: acc.score + a.score, total: acc.total + a.total }),
      { score: 0, total: 0 },
    );

    // Tỷ lệ đúng theo phạm vi (hệ cơ quan / vùng), để chỉ ra chỗ yếu.
    const byScope = new Map<
      string,
      { score: number; total: number; attempts: number }
    >();
    for (const a of attempts) {
      const row = byScope.get(a.scope) ?? { score: 0, total: 0, attempts: 0 };
      row.score += a.score;
      row.total += a.total;
      row.attempts += 1;
      byScope.set(a.scope, row);
    }

    const dueCount = await this.prisma.reviewItem.count({
      where: { userId, dueAt: { lte: new Date() } },
    });

    return {
      attempts,
      totals: {
        ...totals,
        accuracy: totals.total ? totals.score / totals.total : null,
      },
      byScope: [...byScope.entries()]
        .map(([scope, v]) => ({
          scope,
          ...v,
          accuracy: v.total ? v.score / v.total : null,
        }))
        .sort((a, b) => (a.accuracy ?? 1) - (b.accuracy ?? 1)),
      streak: streakDays(attempts.map((a) => a.createdAt)),
      dueCount,
      trackedCount: await this.prisma.reviewItem.count({ where: { userId } }),
    };
  }

  // ------------------------------------------------------------------- lộ trình

  async getPath(token?: string) {
    const userId = await this.userIdOf(token);
    const path = await this.prisma.studyPath.findUnique({ where: { userId } });
    if (!path) return { path: null, session: null, plan: null };
    return {
      path,
      session: await this.buildSession(userId, path),
      plan: buildPlan(planInputOf(path)),
    };
  }

  async savePath(input: PathInput, token?: string) {
    const userId = await this.userIdOf(token);
    const data = {
      goal: String(input.goal ?? '').slice(0, 200) || 'Ôn giải phẫu',
      daysPerWeek: clampInt(input.daysPerWeek, 1, 7),
      minutesPerDay: clampInt(input.minutesPerDay, 10, 180),
      systemKey: String(input.systemKey ?? 'all').slice(0, 64),
      horizonDays: clampInt(input.horizonDays ?? 28, 1, 366),
      focusSystems: normaliseSystems(input.focusSystems, input.systemKey),
      brief: input.brief ? String(input.brief).slice(0, 2000) : null,
    };
    const path = await this.prisma.studyPath.upsert({
      where: { userId },
      // Sửa lộ trình là ĐẶT LẠI mốc bắt đầu: giữ `startedAt` cũ thì người đổi
      // "một tuần" thành "một tháng" ở ngày thứ năm sẽ thấy dàn bài mới đã
      // trôi mất tuần đầu ngay lúc vừa tạo.
      create: { userId, ...data },
      update: { ...data, startedAt: new Date() },
    });
    return {
      path,
      session: await this.buildSession(userId, path),
      plan: buildPlan(planInputOf(path)),
    };
  }

  /**
   * Bung một khối của dàn bài xuống tầng mịn hơn (tháng → tuần, tuần → ngày).
   *
   * Tách thành lời gọi riêng chứ không trả sẵn mọi tầng trong `getPath`: một
   * lộ trình năm mà kể sẵn cả 365 ngày là gửi thừa vài chục lần dữ liệu cho
   * một bảng người dùng chỉ mở một dòng.
   */
  async expandPath(index: number, token?: string) {
    const userId = await this.userIdOf(token);
    const path = await this.prisma.studyPath.findUnique({ where: { userId } });
    if (!path) throw new UnauthorizedException('Chưa có lộ trình');
    return (
      expandBlock(planInputOf(path), clampInt(index, 1, 366)) ?? {
        parent: null,
        blocks: [],
      }
    );
  }

  async deletePath(token?: string) {
    const userId = await this.userIdOf(token);
    await this.prisma.studyPath.deleteMany({ where: { userId } });
    return { success: true };
  }

  /**
   * Buổi học hôm nay.
   *
   * Tính RA từ hàng đợi đến hạn tại thời điểm mở trang, không đọc lịch cứng đã
   * lưu sẵn: nghỉ ba hôm rồi quay lại thì thứ cần ôn là những câu đã quá hạn,
   * chứ không phải "buổi số 4" của một cái lịch vẽ từ tuần trước.
   */
  private async buildSession(
    userId: string,
    path: { minutesPerDay: number; systemKey: string },
  ) {
    const size = Math.min(
      StudyService.MAX_SESSION,
      questionsForMinutes(path.minutesPerDay),
    );
    const now = new Date();

    const due = await this.prisma.reviewItem.findMany({
      where: { userId, dueAt: { lte: now } },
      // Câu hay quên nhất lên trước, rồi tới câu quá hạn lâu nhất.
      orderBy: [{ lapses: 'desc' }, { dueAt: 'asc' }],
      take: size,
    });

    const scopes = await this.prisma.reviewItem.groupBy({
      by: ['scope'],
      where: { userId, dueAt: { lte: now } },
      _count: { _all: true },
    });

    return {
      size,
      dueKeys: due.map((d) => d.itemKey),
      dueByScope: scopes.map((s) => ({ scope: s.scope, count: s._count._all })),
      /** còn bao nhiêu câu mới nên học thêm cho đủ buổi */
      newCount: Math.max(0, size - due.length),
      systemKey: path.systemKey,
    };
  }

  // -------------------------------------------------------------- hàng đợi ôn

  /** Các câu đến hạn ôn, để trang quiz dựng đúng bộ đề của buổi hôm nay. */
  async due(token?: string, limit = 60) {
    const userId = await this.userIdOf(token);
    const items = await this.prisma.reviewItem.findMany({
      where: { userId, dueAt: { lte: new Date() } },
      orderBy: [{ lapses: 'desc' }, { dueAt: 'asc' }],
      take: clampInt(limit, 1, 200),
    });
    return { items };
  }
}

/**
 * Đổi bản ghi lộ trình thành đầu vào của bộ dựng dàn bài.
 *
 * `focusSystems` rỗng nhưng `systemKey` có giá trị là lộ trình tạo từ trước khi
 * có cột này — đọc lùi về `systemKey` để lộ trình cũ không hiện dàn bài trống.
 */
function planInputOf(path: {
  daysPerWeek: number;
  minutesPerDay: number;
  systemKey: string;
  horizonDays: number;
  focusSystems: string[];
  startedAt: Date;
}): PlanInput {
  const focus = path.focusSystems?.length
    ? path.focusSystems
    : path.systemKey && path.systemKey !== 'all'
      ? [path.systemKey]
      : [];
  return {
    horizonDays: path.horizonDays,
    daysPerWeek: path.daysPerWeek,
    minutesPerDay: path.minutesPerDay,
    focusSystems: focus,
    startedAt: path.startedAt,
  };
}

/** Danh sách hệ ưu tiên: bỏ trùng, bỏ "all", và luôn có hệ chọn ở ô đơn lẻ. */
function normaliseSystems(list: unknown, single?: string): string[] {
  // Chú kiểu `unknown[]`: `Array.isArray` trên một `unknown` chỉ thu hẹp được
  // tới `any[]`, và trải một `any[]` ra là mất sạch kiểm tra kiểu ở dòng sau —
  // chính bộ lọc `typeof s === 'string'` bên dưới mới là chỗ thu hẹp thật.
  const raw: unknown[] = Array.isArray(list) ? list : [];
  const all = [...raw, single]
    .filter((s): s is string => typeof s === 'string' && !!s && s !== 'all')
    .map((s) => s.slice(0, 64));
  return [...new Set(all)].slice(0, 8);
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

/** Số ngày học liên tiếp tính tới hôm nay (hoặc hôm qua, để không phạt oan). */
function streakDays(dates: Date[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => dayKey(d)));
  const today = new Date();
  let cursor = days.has(dayKey(today)) ? today : addDays(today, -1);
  if (!days.has(dayKey(cursor))) return 0;
  let n = 0;
  while (days.has(dayKey(cursor))) {
    n += 1;
    cursor = addDays(cursor, -1);
  }
  return n;
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}
