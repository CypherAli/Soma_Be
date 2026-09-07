import { questionsForMinutes } from './review';

/**
 * DÀN BÀI LỘ TRÌNH — chia quãng thời gian người học đặt ra thành các khối xem
 * được bằng mắt.
 *
 * Độ mịn đi theo độ dài quãng, không cố định:
 *   • 1 tuần  → 7 khối NGÀY   (thấy rõ hôm nào học gì)
 *   • 1 tháng → 4 khối TUẦN   (không kể từng ngày; muốn rõ ngày thì bung khối)
 *   • 1 năm   → 12 khối THÁNG
 * Kể một năm ra 365 dòng thì không ai đọc, mà gộp một tuần thành một dòng thì
 * chẳng nói thêm được gì so với "buổi hôm nay". `expandBlock` lo phần bung ra
 * một tầng khi người học bấm vào đúng khối họ quan tâm.
 *
 * Hàm THUẦN và KHÔNG chứa chữ hiển thị: khối chỉ mang `granularity` + số thứ
 * tự, phía web tự đọc thành "Tuần 2" theo ngôn ngữ đang xem. Chuỗi tiếng Việt
 * nằm trong cơ sở dữ liệu là chuỗi không dịch được cho hai thứ tiếng còn lại.
 *
 * Dàn bài KHÔNG được lưu xuống cơ sở dữ liệu — nó tính lại từ (ngày bắt đầu,
 * độ dài quãng, nhịp học, hệ ưu tiên) mỗi lần đọc lộ trình. Lưu lại là mở đường
 * cho dàn bài cũ chỏi với cấu hình mới sau khi người dùng bấm "sửa lộ trình".
 */

export type Granularity = 'day' | 'week' | 'month';

/** Vai trò của một khối trong cả quãng. */
export type BlockKind =
  /** lần đầu chạm hệ này */
  | 'new'
  /** đã học rồi, nay xen kẽ ôn */
  | 'mixed'
  /** khối cuối: tổng ôn toàn bộ */
  | 'review'
  /** khối rơi trọn vào ngày nghỉ (chỉ gặp ở độ mịn NGÀY) */
  | 'rest';

export type PlanBlock = {
  /** số thứ tự trong tầng đang xem, bắt đầu từ 1 */
  index: number;
  granularity: Granularity;
  /** lệch bao nhiêu ngày kể từ ngày bắt đầu lộ trình */
  startDay: number;
  /** độ dài khối, tính bằng ngày */
  days: number;
  /** ngày đầu và ngày cuối của khối, dạng ISO "2026-08-20" */
  from: string;
  to: string;
  /** mã hệ cơ quan khối này nhắm tới, hoặc "all" */
  systemKey: string;
  kind: BlockKind;
  /** số buổi học rơi vào khối, theo nhịp ngày/tuần đã chọn */
  sessions: number;
  /** số câu dự kiến của cả khối */
  questions: number;
  /** khối chứa ngày hôm nay */
  current: boolean;
  /** còn bung nhỏ được nữa không (tuần→ngày, tháng→tuần) */
  expandable: boolean;
};

export type StudyPlan = {
  horizonDays: number;
  granularity: Granularity;
  blocks: PlanBlock[];
  totalSessions: number;
  totalQuestions: number;
  /** hôm nay là ngày thứ mấy của lộ trình (1 = ngày bắt đầu) */
  dayIndex: number;
  /** còn lại bao nhiêu ngày; 0 nghĩa là đã hết quãng */
  daysLeft: number;
};

export type PlanInput = {
  horizonDays: number;
  daysPerWeek: number;
  minutesPerDay: number;
  /** hệ ưu tiên đã sắp thứ tự; rỗng nghĩa là học đều toàn bộ */
  focusSystems: string[];
  startedAt: Date;
};

/** Thứ tự học mặc định khi người dùng không chọn hệ ưu tiên nào. */
export const DEFAULT_SYSTEM_ORDER = [
  'skeletal',
  'muscular',
  'joints',
  'nervous',
  'cardiovascular',
  'visceral',
] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Ngưỡng đổi tầng. Dưới hai tuần thì kể từng ngày, quá năm tháng thì gộp tháng. */
const MAX_DAY_HORIZON = 14;
const MAX_WEEK_HORIZON = 150;

export function granularityFor(horizonDays: number): Granularity {
  if (horizonDays <= MAX_DAY_HORIZON) return 'day';
  if (horizonDays <= MAX_WEEK_HORIZON) return 'week';
  return 'month';
}

export function buildPlan(input: PlanInput, now = new Date()): StudyPlan {
  const horizonDays = clampInt(input.horizonDays, 1, 366);
  const granularity = granularityFor(horizonDays);
  const blocks = sliceBlocks(input, horizonDays, granularity, now);

  const elapsed = daysSince(input.startedAt, now);
  return {
    horizonDays,
    granularity,
    blocks,
    totalSessions: blocks.reduce((n, b) => n + b.sessions, 0),
    totalQuestions: blocks.reduce((n, b) => n + b.questions, 0),
    dayIndex: Math.min(horizonDays, Math.max(1, elapsed + 1)),
    daysLeft: Math.max(0, horizonDays - elapsed),
  };
}

/**
 * Bung một khối xuống một tầng mịn hơn: tháng → tuần, tuần → ngày.
 *
 * Đây là câu trả lời cho "một tháng không cần rõ ngày, cần rõ thì hỏi tiếp":
 * dàn bài tháng vẫn gọn bốn dòng, ai muốn biết tuần 2 gồm những ngày nào thì
 * bấm vào đúng tuần đó. Khối tầng NGÀY không bung được nữa.
 */
export function expandBlock(
  input: PlanInput,
  index: number,
  now = new Date(),
): { parent: PlanBlock; granularity: Granularity; blocks: PlanBlock[] } | null {
  const plan = buildPlan(input, now);
  const parent = plan.blocks.find((b) => b.index === index);
  if (!parent || !parent.expandable) return null;

  const finer: Granularity = parent.granularity === 'month' ? 'week' : 'day';
  const spans =
    finer === 'week'
      ? evenSpans(parent.startDay, parent.days, Math.ceil(parent.days / 7))
      : Array.from({ length: parent.days }, (_, i) => ({
          startDay: parent.startDay + i,
          days: 1,
        }));

  const perQuestion = questionsForMinutes(input.minutesPerDay);
  const studyDays = studyDaySet(input.daysPerWeek);

  const blocks = spans.map((span, i) => {
    const sessions = sessionsIn(span.startDay, span.days, studyDays);
    return finish(
      {
        index: i + 1,
        granularity: finer,
        startDay: span.startDay,
        days: span.days,
        // Khối con thừa hưởng nội dung của khối cha — bung ra là để xem lịch
        // chi tiết, không phải để đổi thứ đang học.
        systemKey: parent.systemKey,
        kind:
          sessions === 0
            ? 'rest'
            : parent.kind === 'rest'
              ? 'mixed'
              : parent.kind,
        sessions,
        questions: sessions * perQuestion,
      },
      input.startedAt,
      now,
      finer !== 'day',
    );
  });

  return { parent, granularity: finer, blocks };
}

// ---------------------------------------------------------------- bên trong

function sliceBlocks(
  input: PlanInput,
  horizonDays: number,
  granularity: Granularity,
  now: Date,
): PlanBlock[] {
  const count =
    granularity === 'day'
      ? horizonDays
      : granularity === 'week'
        ? Math.ceil(horizonDays / 7)
        : // 365 ngày phải ra ĐÚNG 12 tháng, nên làm tròn chứ không lấy trần:
          // ceil(365/30) = 13 và dòng thứ 13 chỉ dài 5 ngày, nhìn như lỗi.
          Math.max(1, Math.round(horizonDays / 30));

  const spans =
    granularity === 'week'
      ? evenSpans(0, horizonDays, count, 7)
      : evenSpans(0, horizonDays, count);

  const order = systemOrder(input.focusSystems);
  const studyDays = studyDaySet(input.daysPerWeek);
  const perQuestion = questionsForMinutes(input.minutesPerDay);
  // Khối cuối để tổng ôn, nhưng chỉ khi dàn bài đủ dài: quãng hai khối mà mất
  // một khối cho tổng ôn thì còn đúng một khối để học nội dung mới.
  const reviewAt = count >= 3 ? count - 1 : -1;
  const seen = new Set<string>();

  return spans.map((span, i) => {
    const isReview = i === reviewAt;
    const systemKey = isReview ? 'all' : order[i % order.length];
    const kind: BlockKind = isReview
      ? 'review'
      : seen.has(systemKey)
        ? 'mixed'
        : 'new';
    seen.add(systemKey);

    const sessions = sessionsIn(span.startDay, span.days, studyDays);
    return finish(
      {
        index: i + 1,
        granularity,
        startDay: span.startDay,
        days: span.days,
        systemKey,
        kind: sessions === 0 ? 'rest' : kind,
        sessions,
        questions: sessions * perQuestion,
      },
      input.startedAt,
      now,
      granularity !== 'day',
    );
  });
}

/** Điền nốt phần tính từ ngày bắt đầu: mốc lịch thật và khối nào đang chạy. */
function finish(
  base: Omit<PlanBlock, 'from' | 'to' | 'current' | 'expandable'>,
  startedAt: Date,
  now: Date,
  expandable: boolean,
): PlanBlock {
  const today = daysSince(startedAt, now);
  return {
    ...base,
    from: isoDay(addDays(startedAt, base.startDay)),
    to: isoDay(addDays(startedAt, base.startDay + base.days - 1)),
    current: today >= base.startDay && today < base.startDay + base.days,
    expandable: expandable && base.days > 1,
  };
}

/**
 * Chia `total` ngày thành `count` khối liền nhau, không hụt không chồng.
 *
 * `preferred` (7 với tầng tuần) giữ cho mọi tuần đúng bảy ngày và dồn phần
 * thiếu vào khối cuối — 30 ngày phải là "4 tuần + 2 ngày", không phải bốn khối
 * 7,5 ngày làm mốc lịch lệch khỏi thứ Hai.
 */
function evenSpans(
  offset: number,
  total: number,
  count: number,
  preferred?: number,
): { startDay: number; days: number }[] {
  const spans: { startDay: number; days: number }[] = [];
  if (preferred) {
    for (let i = 0; i < count; i += 1) {
      const startDay = offset + i * preferred;
      spans.push({
        startDay,
        days: Math.min(preferred, offset + total - startDay),
      });
    }
    return spans;
  }
  for (let i = 0; i < count; i += 1) {
    const from = Math.round((i * total) / count);
    const to = Math.round(((i + 1) * total) / count);
    spans.push({ startDay: offset + from, days: Math.max(1, to - from) });
  }
  return spans;
}

/**
 * Chọn `daysPerWeek` ngày học rải đều trong tuần.
 *
 * Rải đều chứ không dồn đầu tuần: 4 buổi/tuần thành thứ 2-3-4-5 rồi nghỉ ba
 * hôm liền là đúng cái nhịp làm quên bài mà lịch ôn đang chống lại.
 */
export function studyDaySet(daysPerWeek: number): Set<number> {
  const d = clampInt(daysPerWeek, 1, 7);
  const set = new Set<number>();
  for (let i = 0; i < d; i += 1) set.add(Math.floor((i * 7) / d));
  return set;
}

function sessionsIn(
  startDay: number,
  days: number,
  studyDays: Set<number>,
): number {
  let n = 0;
  for (let d = startDay; d < startDay + days; d += 1) {
    if (studyDays.has(((d % 7) + 7) % 7)) n += 1;
  }
  return n;
}

/** Hệ ưu tiên lên trước, phần còn lại nối sau để cả quãng vẫn phủ hết cơ thể. */
function systemOrder(focus: string[]): string[] {
  const picked = focus.filter((s) => s && s !== 'all');
  if (!picked.length) return [...DEFAULT_SYSTEM_ORDER];
  const rest = DEFAULT_SYSTEM_ORDER.filter((s) => !picked.includes(s));
  return [...new Set([...picked, ...rest])];
}

function daysSince(from: Date, to: Date): number {
  return Math.floor(
    (startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS,
  );
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(from: Date, days: number): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

function isoDay(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${String(d.getDate()).padStart(2, '0')}`;
}

function clampInt(value: unknown, min: number, max: number): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}
