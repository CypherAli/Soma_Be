import { BadRequestException } from '@nestjs/common';
import { StudyService, type AttemptInput } from './study.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('account attempt persistence', () => {
  function setup() {
    const tx = {
      quizAttempt: { create: jest.fn().mockResolvedValue({ id: 'attempt' }) },
      personalQuestion: {
        findMany: jest.fn().mockResolvedValue([{ id: 'owned' }]),
      },
      reviewItem: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const prisma = {
      $transaction: jest.fn((fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    const auth = { me: jest.fn().mockResolvedValue({ user: { id: 'owner' } }) };
    return {
      tx,
      prisma,
      service: new StudyService(
        prisma as unknown as PrismaService,
        auth as unknown as AuthService,
      ),
    };
  }
  const attempt: AttemptInput = { source: 'model', score: 1, total: 2 };

  it.each([
    { total: 0 },
    { total: 501 },
    { total: 1.5 },
    { score: 3 },
    { score: -1 },
  ])('rejects invalid totals or scores before writing: %p', async (change) => {
    const { service, prisma } = setup();
    await expect(
      service.recordAttempt({ ...attempt, ...change }, 'session'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('merges repeated formats of a model fact into one schedule update', async () => {
    const { service, tx } = setup();
    await service.recordAttempt(
      {
        ...attempt,
        items: [true, true].map((correct) => ({
          itemKey: 'model:fact',
          source: 'model',
          correct,
        })),
      },
      'session',
    );
    expect(tx.reviewItem.upsert).toHaveBeenCalledTimes(1);
    expect(tx.reviewItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ reps: 1 }) as unknown,
      }),
    );
  });

  it('keeps a repeated fact due for review if any response was incorrect', async () => {
    const { service, tx } = setup();
    await service.recordAttempt(
      {
        ...attempt,
        items: [false, true].map((correct) => ({
          itemKey: 'model:fact',
          source: 'model',
          correct,
        })),
      },
      'session',
    );
    expect(tx.reviewItem.upsert).toHaveBeenCalledTimes(1);
    expect(tx.reviewItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ lapses: 1, reps: 0 }) as unknown,
      }),
    );
  });

  it('rejects mismatched source prefixes before writing', async () => {
    const { service, prisma } = setup();
    await expect(
      service.recordAttempt(
        {
          ...attempt,
          items: [
            { itemKey: 'personal:foreign', source: 'model', correct: true },
          ],
        },
        'session',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects missing, unapproved or foreign personal questions before creating an attempt', async () => {
    const { service, tx } = setup();
    tx.personalQuestion.findMany.mockResolvedValue([]);
    await expect(
      service.recordAttempt(
        {
          ...attempt,
          source: 'personal',
          items: [
            { itemKey: 'personal:foreign', source: 'personal', correct: false },
          ],
        },
        'session',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.personalQuestion.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['foreign'] }, userId: 'owner', approved: true },
      select: { id: true },
    });
    expect(tx.quizAttempt.create).not.toHaveBeenCalled();
    expect(tx.reviewItem.upsert).not.toHaveBeenCalled();
  });

  it('records approved owner questions and their reviews within the same transaction', async () => {
    const { service, tx, prisma } = setup();
    await service.recordAttempt(
      {
        ...attempt,
        source: 'personal',
        items: [
          { itemKey: 'personal:owned', source: 'personal', correct: true },
        ],
      },
      'session',
    );
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.quizAttempt.create).toHaveBeenCalledTimes(1);
    expect(tx.reviewItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ userId: 'owner' }) as unknown,
      }),
    );
  });
});
