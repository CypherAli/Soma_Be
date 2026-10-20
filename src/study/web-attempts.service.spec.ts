import {
  BadRequestException,
  ConflictException,
  ValidationPipe,
} from '@nestjs/common';
import { WebAttemptsService } from './web-attempts.service';
import { SubmitAttemptDto } from './dto/submit-attempt.dto';
import type { ContentService } from '../content/content.service';
import type { AuthService } from '../auth/auth.service';
import type { PrismaService } from '../prisma/prisma.service';
import type { StudyService } from './study.service';

describe('web answer grading boundary', () => {
  const request: SubmitAttemptDto = {
    clientRequestId: 'f3548a21-1da2-42b3-8c55-417bc5eb5583',
    source: 'book',
    answers: [{ questionId: 'book-1', answerId: 'book-1:B' }],
  };
  function setup() {
    const value = {
      id: 'book-1',
      region: 'HEAD',
      options: { A: 'First', B: 'Second' },
      answer: 'A',
    };
    const scene = {
      slug: 'hand',
      visibleSystems: ['skeletal'],
      hotspots: [
        {
          key: 'bone',
          label: { vi: 'Bone' },
          note: { vi: 'Note' },
          latinName: 'Os',
        },
      ],
    };
    const content = {
      definitions: new Map([
        [
          'book',
          { id: 'book', source: '/kb/anatomy-mcq.json', payload: { value } },
        ],
        [
          'scene',
          {
            id: 'scene',
            source: 'src/lib/scenes/hand.ts',
            payload: { value: scene },
          },
        ],
      ]),
      snapshot: jest.fn().mockResolvedValue({ documents: {} }),
      studySources: { atlas: [{ page: 1, hotspotKey: 'bone' }], schools: [] },
    };
    const prisma = {
      quizAttempt: { findUnique: jest.fn().mockResolvedValue(null) },
      personalQuestion: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const study = {
      recordAttempt: jest
        .fn()
        .mockImplementation((input: unknown) => Promise.resolve(input)),
    };
    const service = new WebAttemptsService(
      content as unknown as ContentService,
      {
        me: () => Promise.resolve({ user: { id: 'owner' } }),
      } as unknown as AuthService,
      prisma as unknown as PrismaService,
      study as unknown as StudyService,
    );
    return { service, study, prisma, content };
  }

  it('derives a zero score for a wrong choice and cannot be overridden by forged scores', async () => {
    const { service, study } = setup();
    await service.submit(
      { ...request, ...{ score: 1, total: 1, correct: true } },
      'token',
    );
    expect(study.recordAttempt).toHaveBeenCalledWith(
      expect.objectContaining({
        score: 0,
        total: 1,
        items: [expect.objectContaining({ correct: false })],
      }),
      'token',
    );
  });

  it('rejects legacy client-graded properties at the HTTP DTO boundary', async () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
    await expect(
      pipe.transform(
        { ...request, score: 1, total: 1, items: [] },
        { type: 'body', metatype: SubmitAttemptDto },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      pipe.transform(request, { type: 'body', metatype: SubmitAttemptDto }),
    ).resolves.toBeInstanceOf(SubmitAttemptDto);
  });

  it('uses the published answer instead of the original answer', async () => {
    const { service, content } = setup();
    content.snapshot.mockResolvedValue({
      documents: {
        book: {
          value: {
            id: 'book-1',
            region: 'HEAD',
            options: { A: 'First', B: 'Second' },
            answer: 'B',
          },
        },
      },
    });
    await expect(service.submit(request, 'token')).resolves.toMatchObject({
      score: 1,
    });
  });

  it.each([
    { answers: [{ questionId: 'missing', answerId: 'missing:A' }] },
    { answers: [{ questionId: 'book-1', answerId: 'book-1:Z' }] },
    { answers: [...request.answers, ...request.answers] },
    { scope: 'WRONG' },
  ])(
    'rejects invalid identities, choices, duplicates and scope: %p',
    async (change) => {
      const { service, study } = setup();
      await expect(
        service.submit({ ...request, ...change }, 'token'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(study.recordAttempt).not.toHaveBeenCalled();
    },
  );

  it('validates model facts and preserves the shared review identity', async () => {
    const { service } = setup();
    await expect(
      service.submit(
        {
          ...request,
          source: 'model',
          scope: 'skeletal',
          answers: [
            { questionId: 'hand/bone#system', answerId: 'skeletal' },
            { questionId: 'hand/bone#latin', answerId: 'hand/bone' },
          ],
        },
        'token',
      ),
    ).resolves.toMatchObject({
      score: 2,
      total: 2,
      items: [
        expect.objectContaining({ itemKey: 'model:hand/bone' }),
        expect.objectContaining({ itemKey: 'model:hand/bone' }),
      ],
    });
  });

  it('supports atlas options and unanswered questions', async () => {
    const { service } = setup();
    await expect(
      service.submit(
        {
          ...request,
          source: 'atlas',
          answers: [{ questionId: 'atlas-1-bone', answerId: '1:0:ok' }],
        },
        'token',
      ),
    ).resolves.toMatchObject({ score: 1 });
    await expect(
      service.submit(
        { ...request, answers: [{ questionId: 'book-1' }] },
        'token',
      ),
    ).resolves.toMatchObject({ score: 0, total: 1 });
  });

  it('grades scenes stored in a bound dictionary as well as individual scene documents', async () => {
    const { service, content } = setup();
    const original = content.definitions.get('scene')!;
    content.snapshot.mockResolvedValue({
      documents: { scene: { value: { hand: original.payload.value } } },
    });
    await expect(
      service.submit(
        {
          ...request,
          source: 'model',
          answers: [
            { questionId: 'hand/bone#identify', answerId: 'hand/bone' },
          ],
        },
        'token',
      ),
    ).resolves.toMatchObject({ score: 1 });
  });

  it('rejects private questions owned by another account', async () => {
    const { service, prisma, study } = setup();
    await expect(
      service.submit({ ...request, source: 'personal' }, 'token'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.personalQuestion.findMany).toHaveBeenCalledWith({
      where: { userId: 'owner', approved: true, id: { in: ['book-1'] } },
    });
    expect(study.recordAttempt).not.toHaveBeenCalled();
  });

  it('returns the receipt on a matching retry and rejects reuse with a different payload', async () => {
    const { service, prisma, study } = setup();
    const first = (await service.submit(request, 'token')) as {
      requestFingerprint: string;
    };
    const receipt = {
      id: 'saved',
      requestFingerprint: first.requestFingerprint,
    };
    prisma.quizAttempt.findUnique.mockResolvedValue(receipt);
    await expect(service.submit(request, 'token')).resolves.toBe(receipt);
    await expect(
      service.submit(
        {
          ...request,
          answers: [{ questionId: 'book-1', answerId: 'book-1:A' }],
        },
        'token',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(study.recordAttempt).toHaveBeenCalledTimes(1);
  });
});
