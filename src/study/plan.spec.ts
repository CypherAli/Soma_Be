import { buildPlan, expandBlock, granularityFor, studyDaySet } from './plan';

const START = new Date('2026-08-20T00:00:00');

const base = {
  daysPerWeek: 4,
  minutesPerDay: 25,
  focusSystems: [] as string[],
  startedAt: START,
};

describe('granularityFor', () => {
  it('đổi tầng theo độ dài quãng, không cố định một kiểu', () => {
    expect(granularityFor(7)).toBe('day');
    expect(granularityFor(28)).toBe('week');
    expect(granularityFor(365)).toBe('month');
  });
});

describe('buildPlan', () => {
  it('một tuần ra đúng bảy khối NGÀY liền nhau', () => {
    const plan = buildPlan({ ...base, horizonDays: 7 }, START);

    expect(plan.granularity).toBe('day');
    expect(plan.blocks).toHaveLength(7);
    expect(plan.blocks[0].from).toBe('2026-08-20');
    expect(plan.blocks[6].to).toBe('2026-08-26');
    // Bảy ngày mà nhịp 4 buổi/tuần thì ba khối là ngày nghỉ, phải nói ra chứ
    // không lặng lẽ hứa học đủ bảy hôm.
    expect(plan.blocks.filter((b) => b.kind === 'rest')).toHaveLength(3);
    expect(plan.totalSessions).toBe(4);
  });

  it('một tháng ra bốn khối TUẦN, mỗi tuần đủ bảy ngày', () => {
    const plan = buildPlan({ ...base, horizonDays: 28 }, START);

    expect(plan.granularity).toBe('week');
    expect(plan.blocks).toHaveLength(4);
    expect(plan.blocks.every((b) => b.days === 7)).toBe(true);
    expect(plan.blocks[3].to).toBe('2026-09-16');
    // Khối cuối là tổng ôn toàn thân, không phải thêm một hệ mới sát ngày thi.
    expect(plan.blocks[3]).toMatchObject({ kind: 'review', systemKey: 'all' });
  });

  it('một năm ra đúng 12 khối THÁNG', () => {
    const plan = buildPlan({ ...base, horizonDays: 365 }, START);

    expect(plan.granularity).toBe('month');
    expect(plan.blocks).toHaveLength(12);
    expect(plan.blocks[0].from).toBe('2026-08-20');
    expect(plan.blocks[11].to).toBe('2027-08-19');
  });

  it('phủ kín quãng: các khối liền mạch, không hụt cũng không chồng', () => {
    for (const horizonDays of [7, 10, 28, 30, 90, 100, 365]) {
      const plan = buildPlan({ ...base, horizonDays }, START);
      let cursor = 0;
      for (const block of plan.blocks) {
        expect(block.startDay).toBe(cursor);
        cursor += block.days;
      }
      expect(cursor).toBe(horizonDays);
    }
  });

  it('hệ ưu tiên đi trước rồi mới tới phần còn lại của cơ thể', () => {
    const plan = buildPlan(
      { ...base, horizonDays: 28, focusSystems: ['nervous', 'visceral'] },
      START,
    );

    expect(plan.blocks.map((b) => b.systemKey)).toEqual([
      'nervous',
      'visceral',
      'skeletal',
      'all',
    ]);
    expect(plan.blocks[0].kind).toBe('new');
  });

  it('chỉ đúng khối chứa hôm nay được đánh dấu đang chạy', () => {
    const day10 = new Date('2026-08-29T09:00:00');
    const plan = buildPlan({ ...base, horizonDays: 28 }, day10);

    expect(plan.blocks.filter((b) => b.current)).toHaveLength(1);
    expect(plan.blocks[1].current).toBe(true);
    expect(plan.dayIndex).toBe(10);
    expect(plan.daysLeft).toBe(19);
  });
});

describe('expandBlock', () => {
  it('bung một tuần ra bảy ngày, giữ nguyên nội dung đang học', () => {
    const input = { ...base, horizonDays: 28, focusSystems: ['nervous'] };
    const out = expandBlock(input, 2, START);

    expect(out?.granularity).toBe('day');
    expect(out?.blocks).toHaveLength(7);
    expect(out?.blocks[0].from).toBe('2026-08-27');
    expect(out?.blocks.every((b) => b.systemKey === out.parent.systemKey)).toBe(true);
    expect(out?.blocks.filter((b) => b.kind !== 'rest')).toHaveLength(4);
  });

  it('bung một tháng thì ra TUẦN, tức còn bung được một tầng nữa', () => {
    const out = expandBlock({ ...base, horizonDays: 365 }, 1, START);

    expect(out?.granularity).toBe('week');
    expect(out?.blocks[0].expandable).toBe(true);
  });

  it('khối ngày là tầng cuối, không bung thêm', () => {
    expect(expandBlock({ ...base, horizonDays: 7 }, 1, START)).toBeNull();
  });
});

describe('studyDaySet', () => {
  it('rải đều buổi học trong tuần thay vì dồn liền đầu tuần', () => {
    expect([...studyDaySet(4)]).toEqual([0, 1, 3, 5]);
    expect([...studyDaySet(7)]).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(studyDaySet(1).size).toBe(1);
  });
});
