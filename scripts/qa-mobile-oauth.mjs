import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { PrismaService } = require('../dist/src/prisma/prisma.service.js');
const { AuthService } = require('../dist/src/auth/auth.service.js');
const { AuthController } = require('../dist/src/auth/auth.controller.js');
const marker = `mobile-oauth-qa-${randomBytes(12).toString('hex')}`;
const email = `${marker}@example.invalid`;
const hashes = [], codeHashes = [];
const db = new PrismaService();
const service = new AuthService(db, { configured: false });
const controller = new AuthController(service);
const realFetch = globalThis.fetch;
process.env.GOOGLE_CLIENT_ID = 'local-fixture-client';
process.env.GOOGLE_CLIENT_SECRET = 'local-fixture-secret';
process.env.MOBILE_OAUTH_API_URL = 'https://mobile-fixture.example.test/api';
const report = { at: new Date().toISOString(), provider: 'local simulated Google; real PostgreSQL and session persistence', checks: [] };
const hash = s => createHash('sha256').update(s).digest('hex');
const verifier = randomBytes(48).toString('base64url');
const challenge = createHash('sha256').update(verifier).digest('base64url');
const clientState = randomBytes(32).toString('base64url');
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  assert(['oauth2.googleapis.com', 'openidconnect.googleapis.com'].includes(url.hostname));
  if (url.hostname === 'oauth2.googleapis.com') {
    assert.equal(init.body.get('redirect_uri'), 'https://mobile-fixture.example.test/api/auth/oauth/google/callback');
    return new Response(JSON.stringify({ access_token: 'fixture-access-token' }));
  }
  return new Response(JSON.stringify({ sub: marker, name: marker, email, email_verified: true }));
};
async function start() {
  const url = new URL((await controller.mobileOAuthStart('google', { challenge, state: clientState })).url);
  const state = url.searchParams.get('state'); hashes.push(hash(state));
  return state;
}
await db.$connect();
try {
  // Simulate the identity already created on the web, without touching real users.
  const user = await db.user.create({ data: { name: marker, email, googleId: marker } });
  const state = await start();
  const callback = new URL((await controller.oauthCallback('google', 'fixture-code', state)).url);
  const code = callback.searchParams.get('code'); codeHashes.push(hash(code));
  assert.equal(callback.searchParams.get('state'), clientState);
  assert(!callback.href.includes('token='));
  assert.equal(await db.session.count({ where: { userId: user.id } }), 0);
  await assert.rejects(() => service.exchangeMobileOAuth(code, 'x'.repeat(64)), e => e.status === 401);
  // New service instance represents a backend restart between callback and exchange.
  const restarted = new AuthService(db, { configured: false });
  const results = await Promise.allSettled([
    restarted.exchangeMobileOAuth(code, verifier, 'Soma disposable native QA'),
    restarted.exchangeMobileOAuth(code, verifier, 'Soma disposable native QA'),
  ]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  const login = results.find(r => r.status === 'fulfilled').value;
  assert.equal(login.user.id, user.id);
  assert.equal((await service.me(login.token)).user.id, user.id);
  assert.equal(await db.session.count({ where: { userId: user.id } }), 1);
  assert.equal(await db.user.count({ where: { googleId: marker } }), 1);
  report.checks.push('existing web identity reused', 'session token absent from deep link', 'wrong verifier rejected', 'handoff survives backend restart', 'real PostgreSQL concurrent redemption exactly once', 'issued mobile session accepted by shared auth/me');
  const secondState = await start();
  const denied = new URL((await controller.oauthCallback('google', '', secondState, undefined, 'access_denied')).url);
  assert.equal(denied.searchParams.get('error'), 'cancelled');
  assert.equal(await db.oAuthState.count({ where: { stateHash: hash(secondState) } }), 0);
  report.checks.push('provider denial returns to app and consumes state');
  report.passed = true;
} catch (error) { report.error = error.message; report.passed = false; throw error; }
finally {
  globalThis.fetch = realFetch;
  await db.oAuthState.deleteMany({ where: { stateHash: { in: hashes } } });
  await db.mobileOAuthCode.deleteMany({ where: { codeHash: { in: codeHashes } } });
  await db.user.deleteMany({ where: { email, name: marker, googleId: marker } });
  report.cleaned = (await db.user.count({ where: { email } })) === 0;
  fs.writeFileSync('docs/audits/mobile-oauth-postgres-qa.json', JSON.stringify(report, null, 2) + '\n');
  await db.$disconnect();
  console.log(JSON.stringify(report));
}
