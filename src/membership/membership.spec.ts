/* eslint-disable @typescript-eslint/require-await -- Async database doubles preserve Prisma's Promise contract. */
import {
  BadRequestException,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipService } from './membership.service';
import { activePlan, addPremiumMonth, monthWindow } from './policy';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

describe('Monthly plans and automatic bank payments', () => {
  function setup() {
    const user = {
      id: 'user-a',
      plan: 'free',
      premiumUntil: null as Date | null,
    };
    const order = {
      id: 'order-a',
      code: 'SOMA0123456789ABCDEF',
      userId: user.id,
      amount: 25000,
      status: 'pending',
      transactionId: null as string | null,
    };
    const tx = {
      premiumOrder: {
        findUnique: jest.fn(
          async ({
            where,
          }: {
            where: { transactionId?: string; code?: string };
          }) =>
            where.code === order.code ||
            (where.transactionId && where.transactionId === order.transactionId)
              ? { ...order }
              : null,
        ),
        updateMany: jest.fn(async () => {
          if (order.status !== 'pending') return { count: 0 };
          order.status = 'paid';
          order.transactionId = '12345';
          return { count: 1 };
        }),
      },
      user: {
        findUniqueOrThrow: jest.fn(async () => ({ ...user })),
        update: jest.fn(
          async ({ data }: { data: { plan: string; premiumUntil: Date } }) =>
            Object.assign(user, data),
        ),
      },
      $queryRaw: jest.fn(async () => []),
    };
    let used = 0;
    const prisma = {
      user: { findUnique: jest.fn(async () => ({ ...user })) },
      assistantUsage: { findUnique: jest.fn(async () => ({ used })) },
      $executeRaw: jest.fn(
        async (
          _strings: TemplateStringsArray,
          _id: string,
          _month: string,
          limit: number,
        ) => {
          if (used >= limit) return 0;
          used++;
          return 1;
        },
      ),
      $transaction: jest.fn(
        async (work: (transaction: typeof tx) => Promise<unknown>) => work(tx),
      ),
      premiumOrder: { findFirst: jest.fn(async () => ({ ...order })) },
    };
    const values: Record<string, string> = {
      SEPAY_WEBHOOK_KEY: 'test-only-key',
      SEPAY_BANK_CODE: 'TEST',
      SEPAY_ACCOUNT_NUMBER: '0123456789',
      SEPAY_ACCOUNT_HOLDER: 'TEST OWNER',
    };
    const config = { get: (key: string) => values[key] };
    const service = new MembershipService(
      prisma as unknown as PrismaService,
      config as unknown as ConfigService,
    );
    const payload = {
      gateway: 'TEST',
      id: 12345,
      transferType: 'in',
      transferAmount: 25000,
      accountNumber: values.SEPAY_ACCOUNT_NUMBER,
      content: order.code,
    };
    return { service, user, order, tx, prisma, payload };
  }

  it('uses Vietnam calendar months and preserves local time at subscription expiry', () => {
    expect(monthWindow(new Date('2026-10-31T17:00:00Z')).month).toBe('2026-11');
    expect(
      monthWindow(new Date('2026-10-31T16:59:59Z')).resetsAt.toISOString(),
    ).toBe('2026-10-31T17:00:00.000Z');
    expect(
      addPremiumMonth(new Date('2026-02-28T18:00:00Z')).toISOString(),
    ).toBe('2026-03-31T18:00:00.000Z');
    expect(
      addPremiumMonth(new Date('2026-01-30T18:00:00Z')).toISOString(),
    ).toBe('2026-02-27T18:00:00.000Z');
    expect(
      activePlan(
        { plan: 'pro', premiumUntil: new Date('2026-01-01') },
        new Date('2026-10-26'),
      ),
    ).toBe('free');
  });

  it('accepts only learner/teacher profile selections, with no administrative role or plan injection', async () => {
    for (const learningRole of ['learner', 'teacher'])
      expect(
        await validate(plainToInstance(UpdateProfileDto, { learningRole })),
      ).toHaveLength(0);
    expect(
      (
        await validate(
          plainToInstance(UpdateProfileDto, { learningRole: 'admin' }),
        )
      ).length,
    ).toBeGreaterThan(0);
    expect(
      (
        await validate(
          plainToInstance(UpdateProfileDto, { role: 'admin', plan: 'pro' }),
          { whitelist: true, forbidNonWhitelisted: true },
        )
      ).length,
    ).toBe(2);
  });

  it('caps concurrent requests at ten, carries usage on upgrade, then caps at thirty', async () => {
    const { service, user } = setup();
    const free = await Promise.allSettled(
      Array.from({ length: 25 }, () => service.consume(user.id)),
    );
    expect(free.filter((result) => result.status === 'fulfilled')).toHaveLength(
      10,
    );
    const denied = free.find(
      (result) => result.status === 'rejected',
    ) as PromiseRejectedResult;
    const reason: unknown = denied.reason;
    expect(reason).toBeInstanceOf(HttpException);
    if (!(reason instanceof HttpException))
      throw new Error('Expected quota exception');
    expect(reason.getStatus()).toBe(429);
    user.plan = 'pro';
    user.premiumUntil = new Date(Date.now() + 86400000);
    expect((await service.status(user.id)).remaining).toBe(20);
    const pro = await Promise.allSettled(
      Array.from({ length: 30 }, () => service.consume(user.id)),
    );
    expect(pro.filter((result) => result.status === 'fulfilled')).toHaveLength(
      20,
    );
    expect((await service.status(user.id)).remaining).toBe(0);
  });

  it('rejects unauthenticated callbacks and never activates for wrong amount, account or transfer direction', async () => {
    const { service, payload, tx } = setup();
    await expect(service.webhook(undefined, payload)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    await expect(
      service.webhook('Apikey test-only-key', { ...payload, id: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    for (const patch of [
      { transferAmount: 24999 },
      { transferAmount: 25001 },
      { transferType: 'out' },
      { accountNumber: 'other' },
      { gateway: 'other' },
      { content: 'no order' },
    ]) {
      await expect(
        service.webhook('Apikey test-only-key', { ...payload, ...patch }),
      ).resolves.toEqual({ success: true });
    }
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('activates automatically exactly once even when the webhook repeats', async () => {
    const { service, payload, user, tx } = setup();
    await service.webhook('Apikey test-only-key', payload);
    expect(user.plan).toBe('pro');
    expect(user.premiumUntil!.getTime()).toBeGreaterThan(Date.now());
    const expires = user.premiumUntil;
    await service.webhook('Apikey test-only-key', payload);
    expect(tx.user.update).toHaveBeenCalledTimes(1);
    expect(user.premiumUntil).toBe(expires);
  });

  it('looks up payment status only within the authenticated account', async () => {
    const { service, prisma } = setup();
    await service.order('user-a', 'order-a');
    expect(prisma.premiumOrder.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-a', id: 'order-a' },
    });
  });
});
