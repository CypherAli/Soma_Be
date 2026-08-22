import { INITIAL_REVIEW, nextReview, questionsForMinutes } from './review';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-08-19T08:00:00.000Z');

function daysBetween(a: Date, b: Date) {
  return Math.round((a.getTime() - b.getTime()) / DAY);
}

describe('nextReview', () => {
  it('giãn dần khoảng cách khi trả lời đúng liên tiếp', () => {
    let state = { ...INITIAL_REVIEW };
    const spacing: number[] = [];

    for (let i = 0; i < 4; i += 1) {
      const next = nextReview(state, true, NOW);
      spacing.push(next.intervalDays);
      state = next;
    }

    // 1 ngày, 3 ngày, rồi nhân theo hệ số dễ — phải TĂNG đều, không đứng yên
    expect(spacing).toEqual([1, 3, 8, 22]);
    expect(state.ease).toBeGreaterThan(INITIAL_REVIEW.ease);
  });

  it('kéo câu trả lời sai về ôn lại ngay hôm sau và hạ hệ số dễ', () => {
    const learned = { ease: 2.5, intervalDays: 30, reps: 5, lapses: 0 };

    const next = nextReview(learned, false, NOW);

    expect(next.intervalDays).toBe(1);
    expect(daysBetween(next.dueAt, NOW)).toBe(1);
    expect(next.reps).toBe(0);
    expect(next.lapses).toBe(1);
    expect(next.ease).toBeLessThan(learned.ease);
  });

  it('không hạ hệ số dễ xuống dưới sàn, để câu khó không kẹt lại mỗi ngày', () => {
    let state = { ease: 2.5, intervalDays: 10, reps: 3, lapses: 0 };
    for (let i = 0; i < 20; i += 1) state = nextReview(state, false, NOW);

    expect(state.ease).toBeGreaterThanOrEqual(1.3);
  });

  it('chặn trần khoảng cách ở một năm', () => {
    const veryLearned = { ease: 3, intervalDays: 300, reps: 9, lapses: 0 };

    expect(nextReview(veryLearned, true, NOW).intervalDays).toBe(365);
  });

  it('dueAt luôn tính từ mốc thời gian truyền vào', () => {
    const next = nextReview({ ...INITIAL_REVIEW }, true, NOW);

    expect(daysBetween(next.dueAt, NOW)).toBe(next.intervalDays);
  });
});

describe('questionsForMinutes', () => {
  it('quy đổi theo nhịp 45 giây mỗi câu, giống chế độ thi thử', () => {
    expect(questionsForMinutes(25)).toBe(33);
    expect(questionsForMinutes(15)).toBe(20);
  });

  it('kẹp trong khoảng làm được một buổi', () => {
    expect(questionsForMinutes(1)).toBe(5);
    expect(questionsForMinutes(180)).toBe(60);
  });
});
