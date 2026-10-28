import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PremiumOrder } from '@prisma/client';
import { randomBytes, timingSafeEqual } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  activePlan,
  addPremiumMonth,
  monthWindow,
  PREMIUM_DESCRIPTION,
  PREMIUM_PRICE,
} from './policy';
import { record, SePayGateway } from './sepay-gateway';

@Injectable()
export class MembershipService {
  private readonly gateway: SePayGateway;
  private readonly paymentChecks = new Map<
    string,
    {
      expires: number;
      result: ReturnType<SePayGateway['verifiedPayment']>;
    }
  >();
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.gateway = new SePayGateway(config);
  }

  private paymentConfig() {
    const bank = this.config.get<string>('SEPAY_BANK_CODE')?.trim();
    const gateway = this.config.get<string>('SEPAY_GATEWAY')?.trim() || bank;
    const account = this.config.get<string>('SEPAY_ACCOUNT_NUMBER')?.trim();
    const holder = this.config.get<string>('SEPAY_ACCOUNT_HOLDER')?.trim();
    const secret = this.config.get<string>('SEPAY_WEBHOOK_KEY');
    return {
      bank,
      gateway,
      account,
      holder,
      enabled: !!(bank && account && holder && secret),
    };
  }

  async status(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản');
    const window = monthWindow(),
      plan = activePlan(
        user,
        new Date(),
        this.gateway.provider === 'sepay-sandbox',
      ),
      limit = plan === 'pro' ? 30 : 10;
    const usage = await this.prisma.assistantUsage.findUnique({
      where: { userId_month: { userId, month: window.month } },
    });
    return {
      plan,
      limit,
      used: usage?.used ?? 0,
      remaining: Math.max(0, limit - (usage?.used ?? 0)),
      ...window,
      premiumUntil:
        this.gateway.provider === 'sepay-sandbox' &&
        user.sandboxPremiumUntil &&
        (!user.premiumUntil || user.sandboxPremiumUntil > user.premiumUntil)
          ? user.sandboxPremiumUntil
          : user.premiumUntil,
      price: PREMIUM_PRICE,
      paymentEnabled: !!this.gateway.provider || this.paymentConfig().enabled,
      sandbox: this.gateway.provider === 'sepay-sandbox',
    };
  }

  /** One atomic conditional increment; parallel tabs cannot exceed the account limit. */
  async consume(userId: string) {
    const status = await this.status(userId);
    const changed = await this.prisma.$executeRaw`
      INSERT INTO "assistant_usage" ("userId", "month", "used") VALUES (${userId}, ${status.month}, 1)
      ON CONFLICT ("userId", "month") DO UPDATE SET "used" = "assistant_usage"."used" + 1
      WHERE "assistant_usage"."used" < ${status.limit}`;
    if (!changed)
      throw new HttpException(
        {
          message: 'Bạn đã dùng hết lượt hỏi tháng này.',
          code: 'MONTHLY_QUOTA_EXCEEDED',
          ...status,
        },
        429,
      );
    return this.status(userId);
  }

  private orderView(order: {
    id: string;
    code: string;
    amount: number;
    status: string;
    createdAt: Date;
    paidAt: Date | null;
    provider?: string;
    userId?: string;
    paymentSession?: unknown;
  }) {
    const session = this.gateway.session(order.paymentSession);
    if (order.provider?.startsWith('sepay-'))
      return {
        id: order.id,
        code: order.code,
        amount: order.amount,
        status: order.status,
        createdAt: order.createdAt,
        paidAt: order.paidAt,
        sandbox: order.provider === 'sepay-sandbox',
        qrUrl: order.status === 'pending' ? (session?.qrUrl ?? null) : null,
        bank: session?.bank,
        account: session?.account,
        holder: session?.sandbox
          ? 'SePay Sandbox'
          : this.paymentConfig().holder,
        transferContent: session?.memo,
        description: PREMIUM_DESCRIPTION,
        checkoutUrl: order.status === 'pending' ? session?.url : undefined,
        checkout:
          order.status === 'pending' &&
          order.provider === this.gateway.provider &&
          order.userId
            ? this.gateway.checkout({ ...order, userId: order.userId })
            : null,
      };
    const config = this.paymentConfig();
    const qr = new URL('https://vietqr.app/img');
    for (const [key, value] of Object.entries({
      bank: config.bank,
      acc: config.account,
      holder: config.holder,
      amount: String(order.amount),
      des: `${PREMIUM_DESCRIPTION} ${order.code}`,
      template: 'compact',
      showinfo: 'true',
    }))
      if (value) qr.searchParams.set(key, value);
    return {
      ...order,
      bank: config.bank,
      account: config.account,
      holder: config.holder,
      qrUrl: config.enabled ? qr.href : null,
    };
  }

  async checkout(userId: string) {
    const provider = this.gateway.provider ?? 'bank-webhook';
    if (!this.gateway.provider && !this.paymentConfig().enabled)
      throw new ServiceUnavailableException(
        'Thanh toán đang được thiết lập. Vui lòng quay lại sau.',
      );
    const pending = await this.prisma.premiumOrder.findFirst({
      where: { userId, status: 'pending', provider },
    });
    if (pending) return this.checkoutView(pending);
    try {
      return this.checkoutView(
        await this.prisma.premiumOrder.create({
          data: {
            userId,
            provider,
            code: 'SOMA' + randomBytes(8).toString('hex').toUpperCase(),
            amount: PREMIUM_PRICE,
          },
        }),
      );
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const existing = await this.prisma.premiumOrder.findFirst({
        where: { userId, status: 'pending', provider },
      });
      if (!existing) throw error;
      return this.checkoutView(existing);
    }
  }

  async order(userId: string, id: string) {
    let order = await this.prisma.premiumOrder.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    if (
      order.status === 'pending' &&
      order.provider === this.gateway.provider
    ) {
      const verified = await this.checkPayment(order);
      if (verified) {
        await this.settle(order.code, verified.transactionId, order.provider);
        order = await this.prisma.premiumOrder.findFirstOrThrow({
          where: { id, userId },
        });
      }
    }
    return this.orderView(order);
  }

  /** Recover missed IPNs when the owner polls; share provider calls across tabs. */
  private checkPayment(order: PremiumOrder) {
    const key = `${order.provider}:${order.id}`;
    const cached = this.paymentChecks.get(key);
    if (cached && cached.expires > Date.now()) return cached.result;
    if (this.paymentChecks.size >= 256) {
      const oldest: unknown = this.paymentChecks.keys().next().value;
      if (typeof oldest === 'string') this.paymentChecks.delete(oldest);
    }
    const result = this.gateway.verifiedPayment(order.code, order.provider);
    const entry = { expires: Number.POSITIVE_INFINITY, result };
    this.paymentChecks.set(key, entry);
    void result.then(
      () => {
        entry.expires = Date.now() + 4000;
      },
      () => {
        this.paymentChecks.delete(key);
      },
    );
    return result;
  }

  private async checkoutView(order: PremiumOrder) {
    if (
      order.provider !== this.gateway.provider ||
      order.status !== 'pending' ||
      this.gateway.session(order.paymentSession)
    )
      return this.orderView(order);
    // Persist and serialize provider sessions so reloads retain the same invoice.
    let saved: PremiumOrder;
    try {
      saved = await this.prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT "id" FROM "premium_orders" WHERE "id" = ${order.id} FOR UPDATE`;
          const current = await tx.premiumOrder.findUniqueOrThrow({
            where: { id: order.id },
          });
          if (
            current.status !== 'pending' ||
            this.gateway.session(current.paymentSession)
          )
            return current;
          const session = await this.gateway.prepare(current);
          return tx.premiumOrder.update({
            where: { id: order.id },
            data: { paymentSession: session },
          });
        },
        { maxWait: 10000, timeout: 25000 },
      );
    } catch (error) {
      if (error instanceof ServiceUnavailableException)
        return this.orderView(order);
      throw error;
    }
    return this.orderView(saved);
  }

  async simulate(userId: string, id: string) {
    const order = await this.prisma.premiumOrder.findFirst({
      where: { id, userId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn thanh toán');
    const session = this.gateway.session(order.paymentSession);
    if (
      !session ||
      order.provider !== 'sepay-sandbox' ||
      order.status !== 'pending'
    )
      throw new BadRequestException('Đơn không thuộc Sandbox hoặc đã hoàn tất');
    return this.gateway.simulate(session);
  }

  /** Notification payloads only trigger an authenticated SePay order lookup. */
  async ipn(secretHeader: string | undefined, payload: unknown) {
    if (!this.gateway.provider)
      throw new ServiceUnavailableException('SePay gateway disabled');
    this.gateway.checkHeader(secretHeader);
    const p = record(payload),
      invoice = record(p.order).order_invoice_number;
    if (
      p.notification_type !== 'ORDER_PAID' ||
      typeof invoice !== 'string' ||
      !/^SOMA[A-F0-9]{16}$/.test(invoice)
    )
      return { success: true, processed: false };
    const order = await this.prisma.premiumOrder.findUnique({
      where: { code: invoice },
    });
    if (!order || order.provider !== this.gateway.provider)
      return { success: true, processed: false };
    if (order.status === 'paid') return { success: true, processed: true };
    const verified = await this.gateway.verifiedPayment(
      order.code,
      order.provider,
    );
    if (!verified) return { success: true, processed: false };
    await this.settle(order.code, verified.transactionId, order.provider);
    return { success: true, processed: true };
  }

  private async settle(code: string, transactionId: string, provider: string) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.premiumOrder.findUnique({ where: { code } });
      if (
        !order ||
        order.status !== 'pending' ||
        order.provider !== provider ||
        order.amount !== PREMIUM_PRICE
      )
        return;
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${order.userId} FOR UPDATE`;
      const claimed = await tx.premiumOrder.updateMany({
        where: { id: order.id, status: 'pending' },
        data: { status: 'paid', paidAt: new Date(), transactionId },
      });
      if (claimed.count !== 1) return;
      const user = await tx.user.findUniqueOrThrow({
        where: { id: order.userId },
      });
      const sandbox = provider === 'sepay-sandbox',
        now = new Date();
      const expiry = sandbox ? user.sandboxPremiumUntil : user.premiumUntil;
      const until = addPremiumMonth(expiry && expiry > now ? expiry : now);
      await tx.user.update({
        where: { id: user.id },
        data: sandbox
          ? { sandboxPremiumUntil: until }
          : { plan: 'pro', premiumUntil: until },
      });
    });
  }

  /** SePay API-key authentication. Never trust a browser's "paid" flag. */
  async webhook(authorization: string | undefined, payload: unknown) {
    const secret = this.config.get<string>('SEPAY_WEBHOOK_KEY');
    const expected = Buffer.from(`Apikey ${secret ?? ''}`),
      actual = Buffer.from(authorization ?? '');
    if (
      !secret ||
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    )
      throw new UnauthorizedException();
    if (!payload || typeof payload !== 'object' || Array.isArray(payload))
      throw new BadRequestException('Invalid webhook');
    const p = payload as Record<string, unknown>;
    if (
      !Number.isSafeInteger(p.id) ||
      Number(p.id) <= 0 ||
      !Number.isSafeInteger(p.transferAmount) ||
      typeof p.accountNumber !== 'string' ||
      typeof p.gateway !== 'string' ||
      typeof p.content !== 'string'
    )
      throw new BadRequestException('Invalid transaction');
    if (
      p.transferType !== 'in' ||
      p.accountNumber !== this.paymentConfig().account ||
      p.gateway.trim().toLowerCase() !==
        this.paymentConfig().gateway?.toLowerCase() ||
      p.transferAmount !== PREMIUM_PRICE
    )
      return { success: true };
    const codes = [
      ...new Set(
        p.content.toUpperCase().match(/SOMA[A-F0-9]{16}(?![A-Z0-9])/g) ?? [],
      ),
    ];
    if (codes.length !== 1) return { success: true };
    await this.prisma.$transaction(async (tx) => {
      const transactionId = String(p.id);
      if (await tx.premiumOrder.findUnique({ where: { transactionId } }))
        return;
      const order = await tx.premiumOrder.findUnique({
        where: { code: codes[0] },
      });
      if (
        !order ||
        (order.provider && order.provider !== 'bank-webhook') ||
        order.status !== 'pending' ||
        order.amount !== p.transferAmount
      )
        return;
      // Lock the user as well as the order: concurrent renewals extend the current expiry once each.
      await tx.$queryRaw`SELECT "id" FROM "users" WHERE "id" = ${order.userId} FOR UPDATE`;
      const claimed = await tx.premiumOrder.updateMany({
        where: { id: order.id, status: 'pending' },
        data: { status: 'paid', paidAt: new Date(), transactionId },
      });
      if (claimed.count !== 1) return;
      const user = await tx.user.findUniqueOrThrow({
        where: { id: order.userId },
      });
      const now = new Date(),
        start =
          user.premiumUntil && user.premiumUntil > now
            ? user.premiumUntil
            : now;
      await tx.user.update({
        where: { id: user.id },
        data: { plan: 'pro', premiumUntil: addPremiumMonth(start) },
      });
    });
    return { success: true };
  }
}
