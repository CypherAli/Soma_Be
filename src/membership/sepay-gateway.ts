import {
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { SePayPgClient } from 'sepay-pg-node';
import { load } from 'cheerio';
import { PREMIUM_DESCRIPTION, PREMIUM_PRICE } from './policy';

export type PaymentSession = {
  merchant: string;
  provider: string;
  url: string;
  qrUrl: string | null;
  bank: string;
  account: string;
  memo: string;
  sandbox: boolean;
};

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

/** All signing and authenticated SePay API calls stay on the server. */
export class SePayGateway {
  constructor(private readonly config: ConfigService) {}

  settings() {
    const env = this.config.get<string>('SEPAY_PG_ENV');
    const merchant = this.config.get<string>('SEPAY_PG_MERCHANT_ID')?.trim();
    const secret = this.config.get<string>('SEPAY_PG_SECRET_KEY')?.trim();
    const publicBase = this.config
      .get<string>('SEPAY_PG_PUBLIC_BASE_URL')
      ?.replace(/\/$/, '');
    const validEnvironment = env === 'sandbox' || env === 'production';
    let validBase = false;
    try {
      const u = new URL(publicBase ?? '');
      validBase =
        u.protocol === 'https:' &&
        !u.username &&
        !u.password &&
        u.pathname === '/';
    } catch {
      /* Missing configuration disables checkout. */
    }
    return {
      env:
        env === 'production' ? ('production' as const) : ('sandbox' as const),
      merchant,
      secret,
      publicBase,
      enabled:
        this.config.get<string>('SEPAY_PG_ENABLED') === 'true' &&
        validEnvironment &&
        validBase &&
        !!merchant &&
        !!secret &&
        (env !== 'production' || !merchant.startsWith('SP-TEST-')),
    };
  }

  get provider() {
    const s = this.settings();
    return s.enabled ? `sepay-${s.env}` : null;
  }

  checkout(order: {
    id: string;
    code: string;
    userId: string;
    amount: number;
  }) {
    const s = this.settings();
    if (!s.enabled)
      throw new ServiceUnavailableException('Thanh toán đang được thiết lập.');
    const client = new SePayPgClient({
      env: s.env,
      merchant_id: s.merchant!,
      secret_key: s.secret!,
    });
    const callback = (result: string) =>
      `${s.publicBase}/payments/sepay/return?premiumOrder=${encodeURIComponent(order.id)}&payment=${result}`;
    const fields = client.checkout.initOneTimePaymentFields({
      merchant: s.merchant,
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: order.code,
      order_amount: PREMIUM_PRICE,
      currency: 'VND',
      order_description: PREMIUM_DESCRIPTION,
      customer_id: order.userId,
      success_url: callback('success'),
      error_url: callback('error'),
      cancel_url: callback('cancel'),
    });
    return { url: client.checkout.initCheckoutUrl(), fields };
  }

  /** SePay blocks framing. Read only its checkout's QR and bank fields, never render its HTML. */
  async prepare(order: {
    id: string;
    code: string;
    userId: string;
    amount: number;
  }): Promise<PaymentSession> {
    const signed = this.checkout(order),
      settings = this.settings();
    try {
      const response = await fetch(signed.url, {
        method: 'POST',
        body: new URLSearchParams(
          Object.entries(signed.fields).map(([k, v]) => [k, String(v)]),
        ),
        redirect: 'manual',
        signal: AbortSignal.timeout(8000),
      });
      const redirect = response.headers.get('location');
      if (!redirect || ![302, 303].includes(response.status))
        throw new Error('Invalid checkout');
      const url = new URL(redirect, signed.url),
        expected = new URL(signed.url);
      if (
        url.origin !== expected.origin ||
        url.pathname !== '/v1/checkout' ||
        url.searchParams.get('order_invoice_number') !== order.code ||
        url.searchParams.get('order_amount') !== String(PREMIUM_PRICE)
      )
        throw new Error('Invalid session');
      const page = await fetch(url, {
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      });
      if (!page.ok) throw new Error('Checkout unavailable');
      const html = await page.text();
      if (html.length > 1500000) throw new Error('Oversized checkout');
      const $ = load(html),
        account = $('.account-number').first().text().trim(),
        memo = $('.remark').first().text().trim();
      const rawQr = $('.qrcode').first().attr('src');
      let qrUrl: string | null = null;
      if (rawQr) {
        const image = new URL(rawQr, url);
        if (
          image.protocol === 'https:' &&
          !image.username &&
          !image.password &&
          [
            expected.host,
            'vietqr.app',
            'qr.sepay.vn',
            'img.vietqr.io',
          ].includes(image.host)
        )
          qrUrl = image.href;
      }
      if (
        settings.env === 'production' &&
        qrUrl &&
        /skeleton|placeholder/i.test(new URL(qrUrl).pathname)
      )
        qrUrl = null;
      // Do not substitute an old/static account QR when the provider changes its markup.
      if (
        !account ||
        !memo ||
        !qrUrl ||
        account.length > 100 ||
        memo.length > 200
      )
        throw new Error('Missing payment fields');
      const bank = $('.account-number')
        .first()
        .closest('ul')
        .find('li')
        .first()
        .text()
        .replace(/\s+/g, ' ')
        .trim();
      return {
        merchant: settings.merchant!,
        provider: this.provider!,
        url: url.href,
        qrUrl,
        bank: bank.slice(0, 160),
        account,
        memo,
        sandbox: settings.env === 'sandbox',
      };
    } catch {
      throw new ServiceUnavailableException(
        'Chưa tải được QR từ SePay. Vui lòng thử lại.',
      );
    }
  }

  session(value: unknown): PaymentSession | null {
    const session = record(value),
      settings = this.settings();
    if (
      session.merchant !== settings.merchant ||
      session.provider !== this.provider ||
      typeof session.url !== 'string' ||
      typeof session.account !== 'string' ||
      typeof session.memo !== 'string' ||
      typeof session.qrUrl !== 'string'
    )
      return null;
    return session as PaymentSession;
  }

  async simulate(session: PaymentSession) {
    if (
      this.settings().env !== 'sandbox' ||
      this.provider !== 'sepay-sandbox' ||
      session.provider !== this.provider
    )
      throw new UnauthorizedException();
    const url = new URL(session.url);
    if (url.origin !== 'https://pay-sandbox.sepay.vn')
      throw new UnauthorizedException();
    url.pathname = '/v1/checkout/simulatePayment';
    try {
      const response = await fetch(url, {
        method: 'POST',
        redirect: 'error',
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('Simulation failed');
    } catch {
      throw new ServiceUnavailableException(
        'Chưa giả lập được thanh toán. Vui lòng thử lại.',
      );
    }
    // Only the verified IPN may grant access, even in Sandbox.
    return { success: true };
  }

  checkHeader(header: string | undefined) {
    // Some Sandbox merchants send no header. Those callbacks still require an
    // authenticated order lookup below, so an unsigned payload cannot grant access.
    if (header === undefined) return;
    const expected = Buffer.from(this.settings().secret ?? ''),
      actual = Buffer.from(header);
    if (
      !expected.length ||
      expected.length !== actual.length ||
      !timingSafeEqual(expected, actual)
    )
      throw new UnauthorizedException();
  }

  async verifiedPayment(invoice: string, provider: string) {
    const s = this.settings();
    if (!s.enabled || provider !== this.provider) return null;
    try {
      const host =
        s.env === 'sandbox' ? 'pgapi-sandbox.sepay.vn' : 'pgapi.sepay.vn';
      const response = await fetch(
        `https://${host}/v1/order/detail/${encodeURIComponent(invoice)}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${s.merchant}:${s.secret}`).toString('base64')}`,
          },
          signal: AbortSignal.timeout(8000),
          redirect: 'error',
        },
      );
      if (response.status === 404) return null;
      if (!response.ok) throw new Error('Provider unavailable');
      const order = record(record(await response.json()).data);
      if (
        order.order_invoice_number !== invoice ||
        order.order_status !== 'CAPTURED' ||
        order.order_currency !== 'VND' ||
        !exactPrice(order.order_amount)
      )
        return null;
      const transactions = Array.isArray(order.transactions)
        ? order.transactions.map(record)
        : [];
      // The authenticated order API defines CAPTURED as paid. Real bank-transfer
      // orders can also omit transaction history; require the exact invoice,
      // currency, amount and a provider order ID before accepting that case.
      if (
        transactions.length === 0 &&
        ['string', 'number'].includes(typeof order.id) &&
        String(order.id).length > 0
      ) {
        return {
          transactionId: `${provider}:${s.merchant}:order:${String(order.id)}`,
        };
      }
      const transaction = transactions.find(
        (t) =>
          t.transaction_type === 'PAYMENT' &&
          t.transaction_status === 'APPROVED' &&
          t.transaction_currency === 'VND' &&
          exactPrice(t.transaction_amount) &&
          ['BANK_TRANSFER', 'NAPAS_BANK_TRANSFER'].includes(
            String(t.payment_method),
          ),
      );
      const id = transaction?.id;
      if (
        (typeof id !== 'string' && typeof id !== 'number') ||
        !String(id).length
      )
        return null;
      return { transactionId: `${provider}:${s.merchant}:${String(id)}` };
    } catch {
      // SDK/HTTP error objects can contain credentials. Never forward or log them.
      throw new ServiceUnavailableException(
        'Chưa kiểm tra được thanh toán với SePay. Hệ thống sẽ thử lại.',
      );
    }
  }
}

function exactPrice(value: unknown) {
  return (
    (typeof value === 'number' && value === PREMIUM_PRICE) ||
    (typeof value === 'string' && /^25000(?:\.0{1,2})?$/.test(value))
  );
}
