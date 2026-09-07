import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { GradedItemDto, RecordAttemptDto } from './record-attempt.dto';

/**
 * Danh sách nguồn hợp lệ phải khớp với `QuizSourceKey` bên web
 * (Soma_Fe/src/lib/study.ts). Hai bên lệch nhau là hỏng câm: web vẫn gửi, máy
 * chủ trả 400, mà `recordAttempt` bắt lỗi rồi lùi về localStorage — người học
 * thấy điểm hiện ra bình thường nên không ai biết tiến độ chưa bao giờ lên tài
 * khoản. Đúng chuyện đã xảy ra với "vet" khi mở khu thú y.
 */
const errorsOf = (dto: object) => validateSync(dto, { whitelist: true });

describe('RecordAttemptDto — nguồn hợp lệ', () => {
  const base = {
    scope: 'all',
    mode: 'practice',
    score: 3,
    total: 5,
    seconds: 42,
  };

  for (const source of ['model', 'book', 'atlas', 'personal', 'vet']) {
    it(`nhận source "${source}"`, () => {
      const dto = plainToInstance(RecordAttemptDto, { ...base, source });
      expect(errorsOf(dto)).toHaveLength(0);
    });
  }

  it('từ chối nguồn lạ', () => {
    const dto = plainToInstance(RecordAttemptDto, {
      ...base,
      source: 'khong-ton-tai',
    });
    const errs = errorsOf(dto);
    expect(errs.map((e) => e.property)).toContain('source');
  });

  it('nhận cả danh sách từng câu của khu thú y', () => {
    const dto = plainToInstance(RecordAttemptDto, {
      ...base,
      source: 'vet',
      items: [
        {
          itemKey: 'vet:cattle-rumen',
          source: 'vet',
          scope: 'cattle',
          correct: true,
        },
      ],
    });
    expect(errorsOf(dto)).toHaveLength(0);
  });
});

describe('GradedItemDto — nguồn hợp lệ', () => {
  it('nhận source "vet"', () => {
    const dto = plainToInstance(GradedItemDto, {
      itemKey: 'vet:dog-third-eyelid',
      source: 'vet',
      correct: false,
    });
    expect(errorsOf(dto)).toHaveLength(0);
  });

  it('từ chối nguồn lạ', () => {
    const dto = plainToInstance(GradedItemDto, {
      itemKey: 'x:1',
      source: 'linh-tinh',
      correct: false,
    });
    expect(errorsOf(dto).map((e) => e.property)).toContain('source');
  });
});
