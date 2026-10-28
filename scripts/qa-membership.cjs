require('reflect-metadata');
require('dotenv').config({ quiet: true });
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { ConfigService } = require('@nestjs/config');
const { PrismaService } = require('../dist/src/prisma/prisma.service');
const { MembershipService } = require('../dist/src/membership/membership.service');
const { AuthService } = require('../dist/src/auth/auth.service');
const { addPremiumMonth } = require('../dist/src/membership/policy');
const url = new URL(process.env.DATABASE_URL);
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) throw Error('QA is restricted to localhost.');
const prisma = new PrismaService(), key = randomUUID();
const service = new MembershipService(prisma, new ConfigService({ SEPAY_GATEWAY: 'QA', SEPAY_BANK_CODE: 'QA', SEPAY_ACCOUNT_NUMBER: '0000000000', SEPAY_ACCOUNT_HOLDER: 'QA ONLY', SEPAY_WEBHOOK_KEY: key, SEPAY_PG_ENABLED: 'false' }));
const userIds = [];
(async () => {
  await prisma.$connect();
  try {
    for (let i = 0; i < 2; i++) {
      const user = await prisma.user.create({ data: { name: 'Premium QA', email: `qa-${randomUUID()}@example.invalid` } }); userIds.push(user.id);
    }
    const id = userIds[0];
    const free = await Promise.allSettled(Array.from({ length: 30 }, () => service.consume(id)));
    assert.equal(free.filter(result => result.status === 'fulfilled').length, 10);
    assert.equal((await service.status(id)).remaining, 0);
    const pending = await Promise.all(Array.from({ length: 8 }, () => service.checkout(id)));
    assert.equal(new Set(pending.map(order => order.id)).size, 1);
    const order = pending[0];
    assert.equal(order.amount, 25000);assert.ok(order.qrUrl.includes(order.code));
    assert.equal(new URL(order.qrUrl).searchParams.get('amount'),'25000');
    assert.equal(new URL(order.qrUrl).searchParams.get('des'),'PREMIUM '+order.code);
    await assert.rejects(() => service.order(userIds[1], order.id), error => error.getStatus() === 404);
    const event = { id: 700000001, gateway: 'QA', transferType: 'in', accountNumber: '0000000000', transferAmount: 25000, content: order.code };
    await service.webhook('Apikey '+key, { ...event, transferAmount: 24999 });
    assert.equal((await service.order(id, order.id)).status, 'pending');
    await Promise.all(Array.from({ length: 12 }, () => service.webhook('Apikey '+key, event)));
    const premium = await service.status(id);
    assert.equal(premium.plan, 'pro');assert.equal(premium.remaining, 20);
    const renewed = await service.checkout(id);
    await service.webhook('Apikey '+key, { ...event, id: 700000002, content: renewed.code });
    assert.equal((await service.status(id)).premiumUntil.toISOString(), addPremiumMonth(premium.premiumUntil).toISOString());
    const pro = await Promise.allSettled(Array.from({ length: 35 }, () => service.consume(id)));
    assert.equal(pro.filter(result => result.status === 'fulfilled').length, 20);
    await prisma.user.update({ where: { id }, data: { premiumUntil: new Date(0) } });
    assert.equal((await service.status(id)).plan, 'free');
    // Use an isolated session belonging only to the QA user to verify profile persistence.
    const { createHash } = require('node:crypto');const token = randomUUID();
    await prisma.session.create({ data: { tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt: new Date(Date.now()+60000), userId: id } });
    const auth = new AuthService(prisma, {});
    await auth.updateProfile({ learningRole: 'teacher' }, token);
    const profile = await auth.me(token);
    assert.equal(profile.user.learningRole, 'teacher');assert.equal(profile.user.role, 'user');
    console.log('PASS PostgreSQL: exact concurrent 10/30 limits, usage carryover, one pending order, ownership, wrong-amount rejection, automatic activation, duplicate callback idempotency, renewal, expiry and teacher profile persistence.');
  } finally {
    if (userIds.length) await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
