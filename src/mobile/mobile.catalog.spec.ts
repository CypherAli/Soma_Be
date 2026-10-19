import { questionsFromModels, type MobileModel } from './mobile.catalog';
const model: MobileModel = {
  id: 'ban-tay',
  title: 'Bàn tay',
  english: 'Hand',
  description: 'Source',
  system: 'skeletal',
  modelPath: '',
  viewerPath: '',
  attribution: 'Source',
  structures: ['a', 'b', 'c', 'd', 'e'].map((id) => ({
    id,
    meshName: id,
    label: `Cấu trúc ${id}`,
    english: id,
    latin: `Latin ${id}`,
    note: 'Ghi chú thật được biên soạn cho cấu trúc trong thư viện.',
  })),
};
describe('mobile practice catalogue', () => {
  it('keeps the same web review identity and exactly one valid answer', () => {
    const questions = questionsFromModels([model]);
    expect(questions).toHaveLength(5);
    for (const q of questions) {
      expect(q.itemKey).toBe(`model:ban-tay/${q.correctOptionId}`);
      expect(q.options).toHaveLength(4);
      expect(new Set(q.options.map((o) => o.text)).size).toBe(4);
      expect(q.options.filter((o) => o.id === q.correctOptionId)).toHaveLength(
        1,
      );
    }
  });
  it('versions change when the published explanation changes', () => {
    const before = questionsFromModels([model])[0];
    const after = questionsFromModels([
      {
        ...model,
        structures: model.structures.map((s, i) =>
          i === 0 ? { ...s, note: s.note + ' Đã sửa.' } : s,
        ),
      },
    ])[0];
    expect(before.itemKey).toBe(after.itemKey);
    expect(before.version).not.toBe(after.version);
  });
  it('does not invent missing Latin labels or duplicate option text', () => {
    expect(
      questionsFromModels([
        {
          ...model,
          structures: model.structures.map((s) => ({ ...s, latin: 'Same' })),
        },
      ]),
    ).toEqual([]);
  });
});
