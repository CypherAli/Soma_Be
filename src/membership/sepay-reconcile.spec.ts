import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipService } from './membership.service';

describe('SePay authenticated order reconciliation', () => {
  const invoice = 'SOMA0123456789ABCDEF';
  let provider: jest.SpiedFunction<typeof fetch>;
  beforeEach(() => {
    provider = jest.spyOn(globalThis, 'fetch');
  });
  afterEach(() => jest.restoreAllMocks());

  function setup() {
    const user = {
      id: 'owner',
      plan: 'free',
      premiumUntil: null as Date | null,
      sandboxPremiumUntil: null as Date | null,
    };
    const order = {
      id: 'order-a',
      code: invoice,
      userId: user.id,
      provider: 'sepay-production',
      amount: 25000,
      status: 'pending',
      paymentSession: null,
    };
    const update = jest
      .fn()
      .mockImplementation(({ data }: { data: Partial<typeof user> }) =>
        Promise.resolve(Object.assign(user, data)),
      );
    const updateMany = jest.fn().mockImplementation(() => {
      if (order.status !== 'pending') return Promise.resolve({ count: 0 });
      order.status = 'paid';
      return Promise.resolve({ count: 1 });
    });
    const tx = {
      premiumOrder: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ ...order })),
        updateMany,
      },
      user: {
        findUniqueOrThrow: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ ...user })),
        update,
      },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ ...user })),
      },
      assistantUsage: { findUnique: jest.fn().mockResolvedValue({ used: 0 }) },
      premiumOrder: {
        findFirst: jest.fn().mockImplementation(
          ({
            where,
          }: {
            where: {
              id?: string;
              userId: string;
              status?: string;
              provider?: string;
            };
          }) =>
            Promise.resolve(
              (!where.id || where.id === order.id) &&
                where.userId === user.id &&
                (!where.status || where.status === order.status) &&
                (!where.provider || where.provider === order.provider)
                ? { ...order }
                : null,
            ),
        ),
        findFirstOrThrow: jest
          .fn()
          .mockImplementation(() => Promise.resolve({ ...order })),
      },
      $transaction: jest
        .fn()
        .mockImplementation((work: (value: typeof tx) => Promise<unknown>) =>
          work(tx),
        ),
    };
    const config = new ConfigService({
      SEPAY_PG_ENABLED: 'true',
      SEPAY_PG_ENV: 'production',
      SEPAY_PG_MERCHANT_ID: 'SP-PROD-QA',
      SEPAY_PG_SECRET_KEY: 'unit-test-only',
      SEPAY_PG_PUBLIC_BASE_URL: 'https://qa.example.invalid',
    });
    const service = new MembershipService(
      prisma as unknown as PrismaService,
      config,
    );
    return { service, user, order, update, updateMany };
  }
  const captured = {
    id: 17,
    order_invoice_number: invoice,
    order_status: 'CAPTURED',
    order_amount: '25000.00',
    order_currency: 'VND',
    transactions: [],
  };
  function reply(value: unknown) {
    provider.mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ data: value }), { status: 200 }),
      ),
    );
  }

  it('recovers a paid real-bank order with empty history and credits exactly once', async () => {
    reply(captured);
    const { service, user, update } = setup();
    expect((await service.order('owner', 'order-a')).status).toBe('paid');
    expect(user.plan).toBe('pro');
    expect(user.premiumUntil).toBeInstanceOf(Date);
    const expiry = user.premiumUntil?.toISOString();
    expect((await service.order('owner', 'order-a')).status).toBe('paid');
    expect(user.premiumUntil?.toISOString()).toBe(expiry);
    expect(update).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledTimes(1);
  });
  it('recovers payment from the account overview without reopening checkout', async () => {
    reply(captured);
    const { service, user, update } = setup();
    const status = await service.status(user.id);
    expect(status.plan).toBe('pro');
    expect(status.limit).toBe(30);
    expect(status.remaining).toBe(30);
    expect(status.premiumUntil).toBeInstanceOf(Date);
    const again = await service.status(user.id);
    expect(again.premiumUntil).toEqual(status.premiumUntil);
    expect(update).toHaveBeenCalledTimes(1);
    expect(provider).toHaveBeenCalledTimes(1);
  });
  it('never reconciles another account while reading membership', async () => {
    reply(captured);
    const { service, update } = setup();
    await service.status('other-owner');
    expect(provider).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
  it('still returns the existing plan when SePay is temporarily unavailable', async () => {
    provider.mockRejectedValueOnce(new Error('network outage'));
    const { service, user, update } = setup();
    user.plan = 'pro';
    user.premiumUntil = new Date(Date.now() + 86400000);
    expect((await service.status(user.id)).plan).toBe('pro');
    expect(update).not.toHaveBeenCalled();
    reply(captured);
    expect((await service.status(user.id)).plan).toBe('pro');
    expect(update).toHaveBeenCalledTimes(1);
  });
  it("never checks or credits another owner's order", async () => {
    reply(captured);
    const { service, update } = setup();
    await expect(service.order('other-owner', 'order-a')).rejects.toThrow(
      'Không tìm thấy đơn thanh toán',
    );
    expect(provider).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
  it('coalesces concurrent polling of pending orders', async () => {
    reply({ ...captured, order_status: 'AUTHENTICATION_NOT_NEEDED' });
    const { service, update } = setup();
    const results = await Promise.all(
      Array.from({ length: 8 }, () => service.order('owner', 'order-a')),
    );
    expect(results.every((result) => result.status === 'pending')).toBe(true);
    expect(provider).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });
  it.each([
    { order_amount: '1' },
    { order_currency: 'USD' },
    { order_invoice_number: 'OTHER' },
    { order_status: 'CANCELLED' },
    { id: null },
    {
      transactions: [
        {
          id: 'bad',
          transaction_type: 'PAYMENT',
          transaction_status: 'APPROVED',
          payment_method: 'BANK_TRANSFER',
          transaction_amount: '1',
          transaction_currency: 'VND',
        },
      ],
    },
  ])('fails closed for invalid provider evidence %j', async (patch) => {
    reply({ ...captured, ...patch });
    const { service, update } = setup();
    expect((await service.order('owner', 'order-a')).status).toBe('pending');
    expect(update).not.toHaveBeenCalled();
  });
  it('retains a pending order on provider failure and allows retry', async () => {
    provider.mockRejectedValueOnce(new Error('network outage'));
    const { service, update } = setup();
    await expect(service.order('owner', 'order-a')).rejects.toThrow(
      'Chưa kiểm tra được thanh toán',
    );
    expect(update).not.toHaveBeenCalled();
    reply(captured);
    expect((await service.order('owner', 'order-a')).status).toBe('paid');
    expect(provider).toHaveBeenCalledTimes(2);
  });
});
