import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth/auth.service';
import { ContentService } from '../content/content.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudyService } from '../study/study.service';
import { MobileLearningService } from './mobile-learning.service';
import { SourceAttemptDto } from './mobile-learning.dto';

describe('mobile source exams', () => {
  const question = {
    id: 'q1',
    number: 1,
    stem: 'Source question',
    options: [
      { id: 'A', text: 'A' },
      { id: 'B', text: 'B' },
      { id: 'C', text: 'C' },
    ],
    answers: ['A', 'C'],
    gradable: true,
    images: [],
    explanationImages: [],
    sourcePage: 3,
    explanation: 'Source rationale',
  };
  const catalogId = 'data:src/lib/anatomy/drLamBank.ts#drLamCatalog';
  let auth: { me: jest.Mock };
  let prisma: {
    personalDoc: { findFirst: jest.Mock; findMany: jest.Mock };
    quizAttempt: { findUnique: jest.Mock };
    reviewItem: { findMany: jest.Mock };
  };
  let record: jest.Mock;
  let service: MobileLearningService;
  beforeEach(() => {
    auth = { me: jest.fn().mockResolvedValue({ user: { id: 'owner' } }) };
    prisma = {
      personalDoc: {
        findFirst: jest.fn().mockResolvedValue(null),
        findMany: jest.fn().mockResolvedValue([]),
      },
      quizAttempt: { findUnique: jest.fn().mockResolvedValue(null) },
      reviewItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    record = jest.fn().mockImplementation((input) => Promise.resolve(input));
    const definitions = new Map([
      [
        catalogId,
        {
          payload: {
            value: {
              title: 'Sources',
              exams: [{ id: 'exam', file: 'exam.json', title: 'Original PDF' }],
            },
          },
          source: 'catalog',
        },
      ],
      ['q1', { payload: { value: question }, source: '/kb/dr-lam/exam.json' }],
      [
        'q2',
        {
          payload: {
            value: {
              ...question,
              id: 'q2',
              number: 2,
              answers: [],
              gradable: false,
            },
          },
          source: '/kb/dr-lam/exam.json',
        },
      ],
    ]);
    for (const [id, definition] of definitions)
      Object.assign(definition, { id });
    service = new MobileLearningService(
      auth as unknown as AuthService,
      {
        snapshot: () => Promise.resolve({ documents: {} }),
        definitions,
      } as unknown as ContentService,
      prisma as unknown as PrismaService,
      { recordAttempt: record } as unknown as StudyService,
      new ConfigService({}),
    );
  });
  async function submission(): Promise<SourceAttemptDto> {
    const bank = await service.bank('exam', 'token');
    return {
      clientRequestId: '0c185d20-9e21-4d85-82d4-c6ce6fded8a4',
      bankId: 'exam',
      version: bank.version,
      mode: 'practice',
      seconds: 30,
      answers: [
        { id: 'q1', answers: ['C', 'A'] },
        { id: 'q2', answers: [] },
      ],
    };
  }
  it('grades the complete multi-answer set and excludes questions lacking source answers', async () => {
    await service.submit(await submission(), 'token');
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'dr-lam',
        score: 1,
        total: 1,
        items: [
          expect.objectContaining({ correct: true, itemKey: 'dr-lam:q1' }),
        ],
      }),
      'token',
    );
  });
  it('does not give partial credit for one of multiple correct options', async () => {
    const dto = await submission();
    dto.answers[0].answers = ['A'];
    await service.submit(dto, 'token');
    expect(record).toHaveBeenCalledWith(
      expect.objectContaining({ score: 0, total: 1 }),
      'token',
    );
  });
  it('rejects duplicate questions and options', async () => {
    const dto = await submission();
    dto.answers.push(dto.answers[0]);
    await expect(service.submit(dto, 'token')).rejects.toThrow('Trùng');
    dto.answers.pop();
    dto.answers[0].answers = ['A', 'A'];
    await expect(service.submit(dto, 'token')).rejects.toThrow('hợp lệ');
    expect(record).not.toHaveBeenCalled();
  });
  it('preserves attempts when the published source changes', async () => {
    const dto = await submission();
    dto.version = 'old';
    await expect(service.submit(dto, 'token')).rejects.toThrow('cập nhật');
    expect(record).not.toHaveBeenCalled();
  });
  it('never reads a different account’s personal document', async () => {
    await expect(service.bank('personal-other', 'token')).rejects.toThrow();
    expect(prisma.personalDoc.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'other', userId: 'owner' } }),
    );
  });
  it('requires a session before returning either catalog or personal banks', async () => {
    auth.me.mockRejectedValue(new Error('No session'));
    await expect(service.sources()).rejects.toThrow('No session');
    expect(prisma.personalDoc.findMany).not.toHaveBeenCalled();
  });
  it('rejects arbitrary image paths', () => {
    expect(() => service.image('../.env')).toThrow();
  });
});
