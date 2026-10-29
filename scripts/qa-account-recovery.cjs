// Isolated PostgreSQL/HTTP smoke test. Never sends email or changes an existing user.
const assert = require('node:assert/strict');
const { randomUUID, randomBytes } = require('node:crypto');
require('dotenv').config({ quiet: true });
process.env.NODE_ENV = 'test';
process.env.PASSWORD_RESET_FRONTEND_URL = 'https://recovery.example.test';
const { Test } = require('@nestjs/testing');
const { ValidationPipe } = require('@nestjs/common');
const { AppModule } = require('../dist/src/app.module');
const { PrismaService } = require('../dist/src/prisma/prisma.service');
const { MailService } = require('../dist/src/auth/mail.service');
const { configureHttpSecurity } = require('../dist/src/security/http-security');

(async () => {
  const email = `qa-account-recovery-${randomUUID()}@example.invalid`;
  const password = `Qa9${randomBytes(16).toString('hex')}`;
  let app, prisma, owner;
  const deliveries = [];
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(MailService)
      .useValue({
        configured: true,
        sendPasswordReset: async (to, link) => {
          deliveries.push({ to, link });
          return { sent: true };
        },
      })
      .compile();
    app = module.createNestApplication({ bodyParser: false, logger: false });
    app.setGlobalPrefix('api');
    configureHttpSecurity(app);
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.listen(0, '127.0.0.1');
    prisma = app.get(PrismaService);
    const base = `${await app.getUrl()}/api`;
    async function call(path, token, body, expected = 200) {
      const response = await fetch(base + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      assert.equal(response.status, expected, path);
      return response.json();
    }
    const web = await call(
      '/auth/register',
      null,
      { email, password, name: 'Account Recovery QA' },
      201,
    );
    owner = web.user.id;
    const mobile = await call('/auth/login', null, { email, password });
    assert.equal(mobile.user.id, owner);
    assert.equal(
      (await call('/mobile/account', mobile.token)).membership.plan,
      'free',
    );
    const until = new Date(Date.now() + 86400_000);
    await prisma.user.update({
      where: { id: owner, passwordEmail: email },
      data: { plan: 'pro', premiumUntil: until },
    });
    const webProfile = (await call('/auth/me', web.token)).user;
    const mobileProfile = await call('/mobile/account', mobile.token);
    assert.equal(webProfile.id, mobileProfile.user.id);
    assert.equal(webProfile.plan, 'pro');
    assert.equal(mobileProfile.user.plan, 'pro');
    assert.equal(mobileProfile.membership.plan, 'pro');
    assert.equal(mobileProfile.membership.limit, 30);
    assert.equal(
      webProfile.premiumUntil,
      mobileProfile.membership.premiumUntil,
    );
    console.log(
      'PASS PostgreSQL/HTTP: both client sessions read the same Premium entitlement after upgrade',
    );

    await call('/auth/forgot-password', null, { email });
    assert.equal(deliveries.length, 1);
    assert.equal(deliveries[0].to, email);
    const resetUrl = new URL(deliveries[0].link);
    assert.equal(resetUrl.origin, 'https://recovery.example.test');
    const token = resetUrl.searchParams.get('token');
    assert.ok(token);
    const stored = await prisma.passwordResetToken.findFirst({
      where: { userId: owner },
    });
    assert.notEqual(stored.tokenHash, token);
    assert.ok(stored.expiresAt.getTime() - Date.now() <= 15 * 60_000);
    const newPassword = `Qa9${randomBytes(16).toString('hex')}`;
    await call('/auth/reset-password', null, { token, newPassword });
    await call('/auth/me', web.token, undefined, 401);
    await call('/auth/me', mobile.token, undefined, 401);
    await call('/auth/reset-password', null, { token, newPassword }, 400);
    await call('/auth/login', null, { email, password: newPassword });
    console.log(
      'PASS PostgreSQL/HTTP: public recovery URL, hashed one-use token, new password and revocation of both old sessions',
    );
  } finally {
    if (owner && prisma)
      await prisma.user.deleteMany({
        where: { id: owner, passwordEmail: email },
      });
    await app?.close();
  }
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
