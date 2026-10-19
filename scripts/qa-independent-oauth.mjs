import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { PrismaService } = require('../dist/src/prisma/prisma.service.js');
const { AuthService } = require('../dist/src/auth/auth.service.js');
const { AuthController } = require('../dist/src/auth/auth.controller.js');
const marker = `SOMA_QA_IDENTITIES_${Date.now()}_${randomBytes(4).toString('hex')}`;
const email = `${marker.toLowerCase()}@example.invalid`;
const hashes = new Set();
const report = { startedAt: new Date().toISOString(), provider: 'local fake provider; real PostgreSQL persistence', checks: [], cleaned: false };
let googleId = marker + '_linked';
let resetLink;
const realFetch = globalThis.fetch;
for (const provider of ['GOOGLE', 'GITHUB']) {
  process.env[`${provider}_CLIENT_ID`] = 'local-qa-client';
  process.env[`${provider}_CLIENT_SECRET`] = 'local-qa-secret';
}
globalThis.fetch = async input => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  assert(['oauth2.googleapis.com', 'openidconnect.googleapis.com', 'github.com', 'api.github.com'].includes(url.hostname), 'Only disposable provider fixtures are allowed');
  const body = url.pathname.includes('/token') || url.pathname.includes('/access_token') ? { access_token: 'local-provider-token' }
    : url.pathname.endsWith('/user/emails') ? [{ email, primary: true, verified: true }]
    : url.hostname === 'api.github.com' ? { id: marker + '_github', email, name: marker }
    : { sub: googleId, email, name: marker, email_verified: true };
  return new Response(JSON.stringify(body), { status: 200 });
};
const db = new PrismaService();
const service = new AuthService(db, { configured: true, sendPasswordReset: async (_email, link) => { resetLink = link; return { sent: true }; } });
const controller = new AuthController(service);
const check = async (name, work) => { await work(); report.checks.push({ name, passed: true }); console.log('PASS ' + name); };
async function oauth(provider, token) {
  const start = new URL(token ? (await controller.beginOAuthLink(provider, `Bearer ${token}`)).url : await service.oauthUrl(provider));
  const state = start.searchParams.get('state'); hashes.add(createHash('sha256').update(state).digest('hex'));
  const result = await controller.oauthCallback(provider, 'local-code', state);
  const data = new URLSearchParams(new URL(result.url).hash.slice(1));
  return { url: result.url, user: data.has('user') ? JSON.parse(data.get('user')) : null };
}
await db.$connect();
try {
  const login = await service.register({ name: marker, email, password: 'FixturePassword123!' });
  const originalHash = (await db.user.findUniqueOrThrow({ where: { id: login.user.id } })).passwordHash;
  await check('an explicitly linked Google identity logs into the password account directly', async () => {
    assert((await oauth('google', login.token)).url.includes('linked=google'));
    assert.equal((await oauth('google')).user.id, login.user.id);
  });
  googleId = marker + '_private';
  let google, github;
  await check('unlinked Google and GitHub create separate accounts with the same contact email', async () => {
    google = (await oauth('google')).user; github = (await oauth('github')).user;
    assert.equal(new Set([login.user.id, google.id, github.id]).size, 3);
    assert.equal(await db.user.count({ where: { email } }), 3);
    assert.equal(google.role, 'user'); assert.equal(github.role, 'user');
  });
  await check('repeat provider sign-ins reuse their own account and never ask for linking', async () => {
    assert.equal((await oauth('google')).user.id, google.id);
    assert.equal((await oauth('github')).user.id, github.id);
    assert.equal(await db.user.count({ where: { email } }), 3);
  });
  await check('password sign-in selects only the password identity and preserves its hash', async () => {
    assert.equal((await service.login({ email, password: 'FixturePassword123!' })).user.id, login.user.id);
    const current = await db.user.findUniqueOrThrow({ where: { id: login.user.id } });
    assert.equal(current.passwordHash, originalHash); assert.equal(current.passwordEmail, email);
    const others = await db.user.findMany({ where: { id: { in: [google.id, github.id] } } });
    assert(others.every(user => user.passwordHash === null && user.passwordEmail === null));
  });
  await check('password registration rejects only a duplicate password identity', async () => {
    await assert.rejects(() => service.register({ name: marker, email, password: 'FixturePassword123!' }), error => error.status === 409);
  });
  await check('forgot/reset password targets the password account despite identical OAuth emails', async () => {
    await service.forgotPassword({ email });
    assert(resetLink);
    const reset = await db.passwordResetToken.findFirstOrThrow({ where: { userId: login.user.id, usedAt: null } });
    assert.equal(reset.userId, login.user.id);
    await service.resetPassword({ token: new URL(resetLink).searchParams.get('token'), newPassword: 'NewFixturePassword123!' });
    assert.equal((await service.login({ email, password: 'NewFixturePassword123!' })).user.id, login.user.id);
    assert.equal((await oauth('google')).user.id, google.id);
  });
  await check('linking refuses to take over an existing independent GitHub account', async () => {
    const fresh = await service.login({ email, password: 'NewFixturePassword123!' });
    await assert.rejects(() => oauth('github', fresh.token), error => error.status === 409);
    assert.equal((await oauth('github')).user.id, github.id);
  });
} catch (error) {
  report.error = error.message; throw error;
} finally {
  globalThis.fetch = realFetch;
  try {
    await db.oAuthState.deleteMany({ where: { stateHash: { in: [...hashes] } } });
    const fixtures = await db.user.findMany({ where: { email }, select: { id: true, name: true } });
    assert(fixtures.every(user => user.name === marker), 'Refuse cleanup of non-fixture data');
    await db.user.deleteMany({ where: { id: { in: fixtures.map(user => user.id) }, email } });
    assert.equal(await db.user.count({ where: { email } }), 0); report.cleaned = true;
  } finally {
    report.finishedAt = new Date().toISOString(); report.passed = !report.error && report.cleaned;
    fs.writeFileSync('docs/audits/independent-oauth-postgres-qa.json', JSON.stringify(report, null, 2) + '\n');
    await db.$disconnect();
  }
}
