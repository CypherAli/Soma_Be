import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const base = process.env.MOBILE_QA_API_URL ?? 'http://localhost:4000/api';
const gateway = process.env.MOBILE_QA_GATEWAY === '1';
const created = [];
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
async function call(path, body, token, expected = 200) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const value = await response.json();
  assert.equal(
    response.status,
    expected,
    `${path}: ${JSON.stringify(value).slice(0, 300)}`,
  );
  return value;
}
try {
  await db.connect();
  const catalog = await call('/mobile/bootstrap');
  const manifest = JSON.parse(readFileSync(new URL('../resources/mobile/manifest.json', import.meta.url), 'utf8'));
  assert.equal(catalog.schemaVersion, manifest.schemaVersion);
  assert.deepEqual(catalog.models.map((model) => model.id), manifest.models.map((model) => model.id));
  assert.ok(catalog.questions.length >= 20);
  for (const q of catalog.questions) {
    assert.equal(q.options.length, 4);
    assert.equal(q.options.filter((o) => o.id === q.correctOptionId).length, 1);
    assert.equal(q.version.length, 64);
  }
  for (let i = 0; i < 2; i++) {
    const email = `mobile-qa-${randomUUID()}@example.invalid`;
    const password = `Qa1_${randomUUID()}`;
    const account = await call(
      '/auth/register',
      { name: 'Mobile QA', email, password },
      undefined,
      201,
    );
    created.push({ ...account, email });
    const signedIn = await call('/auth/login', { email, password });
    assert.equal(signedIn.user.id, account.user.id);
  }
  const questions = catalog.questions.slice(0, 10);
  const dto = {
    clientRequestId: randomUUID(),
    scope: 'all',
    seconds: 25,
    answers: questions.map((q, i) => ({
      itemKey: q.itemKey,
      version: q.version,
      answerId:
        i === 0
          ? q.options.find((o) => o.id !== q.correctOptionId).id
          : q.correctOptionId,
    })),
  };
  await call('/mobile/attempts', dto, undefined, 401);
  const [first, retry] = await Promise.all([
    call('/mobile/attempts', dto, created[0].token, 201),
    call('/mobile/attempts', dto, created[0].token, 201),
  ]);
  assert.equal(first.id, retry.id);
  assert.equal(first.score, 9);
  assert.equal(first.total, 10);
  const history = await call('/study/history', undefined, created[0].token);
  assert.equal(history.attempts.length, 1);
  assert.equal(history.trackedCount, 10);
  assert.equal(history.totals.score, 9);
  await call(
    '/mobile/attempts',
    { ...dto, seconds: 26 },
    created[0].token,
    409,
  );
  await call(
    '/mobile/attempts',
    {
      ...dto,
      clientRequestId: randomUUID(),
      answers: dto.answers.map((a, i) =>
        i === 0 ? { ...a, version: '0'.repeat(64) } : a,
      ),
    },
    created[0].token,
    409,
  );
  const other = await call('/mobile/attempts', dto, created[1].token, 201);
  assert.notEqual(other.id, first.id);
  const mine = await call('/study/history', undefined, created[0].token);
  assert.equal(mine.attempts.length, 1);
  const changed = await db.query(
    'UPDATE review_items SET "dueAt"=\'2000-01-01 00:00:00\'::timestamp WHERE "userId"=$1',
    [created[0].user.id],
  );
  assert.equal(changed.rowCount, 10);
  const due = await call(gateway ? '/mobile/due' : '/study/due', undefined, created[0].token);
  assert.equal(due.items.length, 10);
  assert.ok(
    due.items.every((item) =>
      catalog.questions.some((q) => q.itemKey === item.itemKey),
    ),
  );
  await db.query(
    `INSERT INTO review_items (id,"userId","itemKey",source,scope,lapses,"dueAt") SELECT 'mobile-overflow-'||$1||'-'||i, $1, 'book:mobile-overflow/'||i, 'book', 'all', 100, '2000-01-01'::timestamp FROM generate_series(1,201) i`,
    [created[0].user.id],
  );
  if (!gateway) {
    const overflow = await call('/study/due?limit=200', undefined, created[0].token);
    assert.equal(overflow.items.length, 200);
    assert.ok(overflow.items.every((item) => item.source === 'book'));
  }
  const mobileDue = await call('/mobile/due', undefined, created[0].token);
  assert.equal(mobileDue.items.length, 10);
  assert.ok(
    mobileDue.items.every((item) =>
      catalog.questions.some((q) => q.itemKey === item.itemKey),
    ),
  );
  const glb = catalog.models.find((model) => model.kind === 'glb');
  assert.ok(glb, 'The current catalogue must contain a published GLB for decoder/allowlist QA');
  const model = await fetch(base + `/mobile/models/${glb.id}/file`);
  assert.equal(model.status, 200);
  assert.equal(
    Buffer.from(await model.arrayBuffer()).toString('ascii', 0, 4),
    'glTF',
  );
  const blocked = await fetch(base + '/mobile/models/unknown/file');
  assert.equal(blocked.status, 404);
  const viewer = await fetch(base + '/mobile/viewer/ban-tay');
  const html = await viewer.text();
  assert.ok(html.includes('SOMA_VIEWER_CONFIG'));
  assert.ok(viewer.headers.get('Content-Security-Policy'));
  assert.ok(!html.includes(created[0].token));
  console.log(
    JSON.stringify({
      passed: true,
      models: catalog.models.length,
      questions: catalog.questions.length,
      checks: [
        'email registration and login share the same identity',
        'server grading',
        'concurrent retry deduplication',
        'conflicting UUID rejected',
        'changed content rejected',
        'account isolation',
        'web history compatibility',
        'due-key compatibility',
        'mobile due filtering before web queue limit',
        'GLB allowlist',
        'token-free viewer',
      ],
    }),
  );
} finally {
  if (created.length)
    await db.query(
      'DELETE FROM users WHERE id = ANY($1::text[]) AND email = ANY($2::text[])',
      [created.map((a) => a.user.id), created.map((a) => a.email)],
    );
  await db.end();
}
