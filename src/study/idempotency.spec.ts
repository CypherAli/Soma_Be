import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { StudyService } from './study.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';

describe('attempt idempotency', () => {
  const input = {
    clientRequestId: 'f3548a21-1da2-42b3-8c55-417bc5eb5583',
    source: 'model',
    scope: 'skeletal',
    score: 1,
    total: 1,
    seconds: 10,
    items: [
      {
        itemKey: 'model:ban-tay/a',
        source: 'model',
        scope: 'skeletal',
        correct: true,
      },
    ],
  };
  function setup() {
    let stored: Record<string, unknown> | null = null;
    const create = jest.fn(({ data }: { data: Record<string, unknown> }) => {
      stored = { id: 'persisted', ...data };
      return Promise.resolve(stored);
    });
    const tx = {
      quizAttempt: { create },
      reviewItem: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({}),
      },
    };
    const lookup = jest.fn(() => Promise.resolve(stored));
    const prisma = {
      $transaction: jest.fn((fn: (value: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
      quizAttempt: { findUnique: lookup },
    };
    const auth = { me: jest.fn().mockResolvedValue({ user: { id: 'owner' } }) };
    return {
      prisma,
      tx,
      lookup,
      service: new StudyService(
        prisma as unknown as PrismaService,
        auth as unknown as AuthService,
      ),
    };
  }
  it('returns the same attempt without applying review scheduling twice', async () => {
    const { service, tx } = setup();
    const first = await service.recordAttempt(input, 'token');
    const retry = await service.recordAttempt(input, 'token');
    expect(retry).toEqual(first);
    expect(tx.quizAttempt.create).toHaveBeenCalledTimes(1);
    expect(tx.reviewItem.upsert).toHaveBeenCalledTimes(1);
  });
  it('rejects a client UUID reused for different answers', async () => {
    const { service } = setup();
    await service.recordAttempt(input, 'token');
    await expect(
      service.recordAttempt(
        { ...input, score: 0, items: [{ ...input.items[0], correct: false }] },
        'token',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });
  it('resolves a cross-process unique constraint race by reading the committed attempt', async () => {
    const { service, prisma, lookup } = setup();
    const first = await service.recordAttempt(input, 'token');
    lookup.mockResolvedValueOnce(null);
    prisma.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError('Duplicate', {
        code: 'P2002',
        clientVersion: '7.8.0',
      }),
    );
    await expect(service.recordAttempt(input, 'token')).resolves.toEqual(first);
  });
});
