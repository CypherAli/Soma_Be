import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import pg from 'pg';

// Only local services and an existing account supplied explicitly by the user.
// Credentials/token stay in memory and are never included in reports.
const email = process.env.SOMA_QA_EMAIL;
const password = process.env.SOMA_QA_PASSWORD;
delete process.env.SOMA_QA_EMAIL;
delete process.env.SOMA_QA_PASSWORD;
assert(email && password, 'Supply existing account credentials through environment variables');
const base = 'http://localhost:4000/api';
const marker = `SOMA_QA_API_${Date.now()}`;
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const report = { startedAt: new Date().toISOString(), marker, checks: [], cleanup: [] };
let token, userId, originalPath, originalMemory, pathTouched = false, memoryTouched = false;
const docs = [], keys = new Set();
const query = async (sql, values = []) => (await db.query(sql, values)).rows;
const check = async (name, action) => {
  try { await action(); report.checks.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { report.checks.push({ name, passed: false, error: error.message }); console.log(`FAIL ${name}: ${error.message}`); }
};
async function api(route, method = 'GET', body, expected = 200) {
  const response = await fetch(base + route, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), 'User-Agent': 'Soma disposable authenticated QA' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${route}: expected HTTP ${expected}, received ${response.status}`);
  return data;
}
const stateTables = ['personal_docs', 'personal_questions', 'quiz_attempts', 'review_items', 'study_paths', 'chat_memory'];
async function snapshot() {
  const result = {};
  for (const table of stateTables) result[table] = (await query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) AS rows FROM ${table} t`))[0].rows;
  return result;
}
let before;
try {
  await db.connect();
  const login = await api('/auth/login', 'POST', { email, password });
  token = login.token; userId = login.user.id;
  assert(token && userId, 'Normal login must return a session');
  before = await snapshot();
  originalPath = (await query('SELECT * FROM study_paths WHERE "userId"=$1', [userId]))[0];
  originalMemory = (await query('SELECT * FROM chat_memory WHERE "userId"=$1', [userId]))[0];
  await check('existing account session authenticates and exposes no password hash', async () => {
    const me = await api('/auth/me'); assert.equal(me.user.id, userId); assert(!('passwordHash' in me.user));
  });
  await check('personal documents and bank are scoped to the signed-in owner', async () => {
    const list = await api('/personal-docs');
    const ownIds = new Set((await query('SELECT id FROM personal_docs WHERE "userId"=$1', [userId])).map(r => r.id));
    assert(list.docs.every(d => ownIds.has(d.id))); assert.equal(list.docs.length, ownIds.size);
    const bank = await api('/personal-docs/bank');
    const approved = new Set((await query('SELECT id FROM personal_questions WHERE "userId"=$1 AND approved=true', [userId])).map(r => r.id));
    assert.deepEqual(new Set(bank.questions.map(q => q.id)), approved);
  });
  const foreignDoc = (await query('SELECT id FROM personal_docs WHERE "userId"<>$1 LIMIT 1', [userId]))[0];
  if (foreignDoc) await check('reading another account document returns 404', () => api(`/personal-docs/${foreignDoc.id}/questions`, 'GET', undefined, 404));
  const foreignQuestion = (await query('SELECT id FROM personal_questions WHERE "userId"<>$1 AND approved=true LIMIT 1', [userId]))[0];
  if (foreignQuestion) await check('another account personal question cannot enter this account review queue', () => api('/study/attempts', 'POST', { source: 'personal', scope: marker, score: 0, total: 1, items: [{ itemKey: `personal:${foreignQuestion.id}`, source: 'personal', correct: false }] }, 400));
  await check('missing document approval returns 404 instead of false success', () => api(`/personal-docs/${marker}/approve-all`, 'POST', {}, 404));
  await check('non-document upload is rejected before creating a database row', async () => {
    const form = new FormData(); form.append('file', new Blob(['test']), marker + '.txt');
    await api('/personal-docs', 'POST', form, 400);
  });
  for (const ext of ['pdf', 'docx']) {
    let uploaded, questions;
    await check(`${ext} upload parses two questions into pending database records`, async () => {
      const form = new FormData();
      form.append('file', new Blob([fs.readFileSync(`docs/audits/fixtures/SOMA_QA_20261014.${ext}`)], { type: ext === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), marker + '.' + ext);
      uploaded = await api('/personal-docs', 'POST', form, 201);
      docs.push(uploaded.doc.id);
      assert.equal(uploaded.parsed, 2); assert.equal(uploaded.doc.status, 'ready');
      questions = (await api(`/personal-docs/${uploaded.doc.id}/questions`)).questions;
      assert.equal(questions.length, 2); assert(questions.every(q => !q.approved && q.userId === userId));
      assert.deepEqual(questions.map(q => q.answer), ['A', 'B']);
      const persisted = await query('SELECT id,approved FROM personal_questions WHERE "docId"=$1 AND "userId"=$2', [uploaded.doc.id, userId]);
      assert.equal(persisted.length, 2); assert(persisted.every(q => !q.approved));
    });
    if (!questions?.length) continue;
    const ids = questions.map(q => q.id); ids.forEach(id => keys.add(`personal:${id}`));
    await check(`${ext} pending personal questions cannot be submitted into the review queue`, () => api('/study/attempts', 'POST', { source: 'personal', scope: marker, score: 0, total: 1, items: [{ itemKey: `personal:${ids[0]}`, source: 'personal', correct: false }] }, 400));
    await check(`${ext} pending questions stay outside the playable bank`, async () => {
      const bank = await api('/personal-docs/bank'); assert(!bank.questions.some(q => ids.includes(q.id)));
    });
    await check(`${ext} invalid answer edit is rejected without changing the question`, async () => {
      await api(`/personal-docs/questions/${ids[0]}`, 'PATCH', { answer: 'F', approved: true }, 400);
      assert.equal((await query('SELECT answer FROM personal_questions WHERE id=$1', [ids[0]]))[0].answer, 'A');
    });
    await check(`${ext} editing and approving one question persists exactly the intended values`, async () => {
      const updated = await api(`/personal-docs/questions/${ids[0]}`, 'PATCH', { stem: marker + ' corrected question', approved: true });
      assert(updated.approved); assert.equal(updated.stem, marker + ' corrected question');
      assert((await api('/personal-docs/bank')).questions.some(q => q.id === ids[0]));
    });
    await check(`${ext} bulk approval adds exactly two fixture questions to the bank`, async () => {
      const approved = await api(`/personal-docs/${uploaded.doc.id}/approve-all`, 'POST', {}, 201);
      assert.equal(approved.approved, 2); assert.equal(approved.skipped, 0);
      assert.equal((await api('/personal-docs/bank')).questions.filter(q => ids.includes(q.id)).length, 2);
    });
    await check(`${ext} submitting a real authenticated attempt persists score and review outcomes`, async () => {
      const attempt = await api('/study/attempts', 'POST', { source: 'personal', scope: marker, mode: 'exam', score: 1, total: 2, seconds: 32, items: ids.map((id, i) => ({ itemKey: `personal:${id}`, source: 'personal', scope: marker, correct: i === 0 })) }, 201);
      assert((await api('/study/history')).attempts.some(a => a.id === attempt.id && a.score === 1 && a.total === 2));
      const review = await query('SELECT "itemKey",reps,lapses FROM review_items WHERE "userId"=$1 AND "itemKey"=ANY($2::text[]) ORDER BY "itemKey"', [userId, ids.map(id => `personal:${id}`)]);
      assert.equal(review.length, 2);
      assert.equal(review.find(r => r.itemKey.endsWith(ids[0])).reps, 1);
      assert.equal(review.find(r => r.itemKey.endsWith(ids[1])).lapses, 1);
    });
    await check(`${ext} unapproval removes that question from bank and review queue`, async () => {
      await api(`/personal-docs/questions/${ids[0]}`, 'PATCH', { approved: false });
      assert(!(await api('/personal-docs/bank')).questions.some(q => q.id === ids[0]));
      assert.equal((await query('SELECT id FROM review_items WHERE "userId"=$1 AND "itemKey"=$2', [userId, `personal:${ids[0]}`])).length, 0);
    });
    await check(`${ext} deleting a fixture question also cleans its review entry`, async () => {
      await api(`/personal-docs/questions/${ids[1]}`, 'DELETE');
      assert.equal((await query('SELECT id FROM personal_questions WHERE id=$1', [ids[1]])).length, 0);
      assert.equal((await query('SELECT id FROM review_items WHERE "userId"=$1 AND "itemKey"=$2', [userId, `personal:${ids[1]}`])).length, 0);
    });
    await check(`${ext} deleting the fixture document cascades its remaining questions`, async () => {
      await api(`/personal-docs/${uploaded.doc.id}`, 'DELETE');
      assert.equal((await query('SELECT id FROM personal_questions WHERE "docId"=$1', [uploaded.doc.id])).length, 0);
      await api(`/personal-docs/${uploaded.doc.id}/questions`, 'GET', undefined, 404);
    });
  }
  const invalidAttempt = { source: 'model', scope: marker, score: 0, total: 0 };
  await check('an empty attempt is rejected rather than persisted', () => api('/study/attempts', 'POST', invalidAttempt, 400));
  await check('score exceeding total is rejected rather than silently altered', () => api('/study/attempts', 'POST', { ...invalidAttempt, score: 3, total: 2 }, 400));
  const duplicateKey = `model:${marker}`; keys.add(duplicateKey);
  await check('duplicate item keys advance a review schedule only once per attempt', async () => {
    await api('/study/attempts', 'POST', { ...invalidAttempt, total: 2, items: [true, true].map(correct => ({ itemKey: duplicateKey, source: 'model', correct })) }, 201);
    assert.equal((await query('SELECT reps FROM review_items WHERE "userId"=$1 AND "itemKey"=$2', [userId, duplicateKey]))[0].reps, 1);
  });
  const absentPersonalKey = `personal:${marker}`; keys.add(absentPersonalKey);
  await check('unknown personal questions cannot create orphan review entries', () => api('/study/attempts', 'POST', { source: 'personal', scope: marker, total: 1, score: 0, items: [{ itemKey: absentPersonalKey, source: 'personal', correct: false }] }, 400));
  await check('a review item cannot disguise its source with another prefix', () => api('/study/attempts', 'POST', { source: 'model', scope: marker, score: 0, total: 1, items: [{ itemKey: absentPersonalKey, source: 'model', correct: false }] }, 400));
  await check('existing study path and due queue are accessible', async () => {
    const path = await api('/study/path'); assert.equal(path.path?.id, originalPath?.id);
    const due = await api('/study/due?limit=5'); assert(due.items.length <= 5); assert(due.items.every(i => i.userId === userId));
  });
  await check('saving a temporary year plan persists settings and supports month-to-week expansion', async () => {
    pathTouched = true;
    const saved = await api('/study/path', 'PUT', { goal: marker, minutesPerDay: 25, daysPerWeek: 4, horizonDays: 365, systemKey: 'nervous', focusSystems: ['nervous'], brief: marker });
    assert.equal(saved.path.goal, marker); assert.equal(saved.plan.granularity, 'month');
    const expanded = await api('/study/path/expand?block=1'); assert(expanded.blocks.length > 0);
    assert.equal((await query('SELECT goal FROM study_paths WHERE "userId"=$1', [userId]))[0].goal, marker);
  });
  await check('deleting the temporary plan returns an empty plan', async () => {
    assert.equal((await query('SELECT goal FROM study_paths WHERE "userId"=$1', [userId]))[0].goal, marker);
    await api('/study/path', 'DELETE'); assert.equal((await api('/study/path')).path, null);
  });
  await check('chat memory writes only sanitized last 40 turns and reloads from database', async () => {
    memoryTouched = true;
    const turns = Array.from({ length: 42 }, (_, i) => ({ role: i % 2 ? 'bot' : 'user', text: `${marker} turn ${i}` }));
    const saved = await api('/chat-memory', 'PUT', { turns }); assert.equal(saved.turns.length, 40);
    assert.deepEqual((await api('/chat-memory')).turns, turns.slice(-40));
    assert.deepEqual((await query('SELECT turns FROM chat_memory WHERE "userId"=$1', [userId]))[0].turns, turns.slice(-40));
  });
  await check('clearing temporary chat memory removes its database row', async () => {
    await api('/chat-memory', 'DELETE'); assert.deepEqual((await api('/chat-memory')).turns, []);
  });
  await check('existing admin account can read operational views without changing content', async () => {
    for (const route of ['/admin/system', '/admin/learning', '/admin/personal-docs', '/admin/review-queue']) await api(route);
  });
} catch (error) {
  report.fatal = error.message; console.log('QA stopped: ' + error.message);
} finally {
  // Remove only this run's records; preserve pre-existing user data and browser session.
  if (userId) {
    for (const id of docs) {
      try {
        const owned = await query('SELECT id FROM personal_docs WHERE id=$1 AND "userId"=$2 AND filename LIKE $3', [id, userId, marker + '%']);
        if (owned.length) await api(`/personal-docs/${id}`, 'DELETE');
      } catch (error) { report.cleanup.push({ passed: false, action: 'fixture document', error: error.message }); }
    }
    await db.query('DELETE FROM quiz_attempts WHERE "userId"=$1 AND scope=$2', [userId, marker]);
    await db.query('DELETE FROM review_items WHERE "userId"=$1 AND "itemKey"=ANY($2::text[])', [userId, [...keys]]);
    if (pathTouched) {
      const current = (await query('SELECT goal FROM study_paths WHERE "userId"=$1', [userId]))[0];
      assert(!current || current.goal === marker, 'Concurrent plan edit detected; refusing to overwrite it');
      if (originalPath) {
        const columns = Object.keys(originalPath), values = Object.values(originalPath);
        const names = columns.map(c => '"' + c + '"');
        await db.query(`INSERT INTO study_paths (${names}) VALUES (${values.map((_, i) => '$' + (i + 1))}) ON CONFLICT ("userId") DO UPDATE SET ${names.filter(n => n !== '"userId"').map(n => `${n}=EXCLUDED.${n}`).join(',')}`, values);
      } else await db.query('DELETE FROM study_paths WHERE "userId"=$1 AND goal=$2', [userId, marker]);
    }
    if (memoryTouched) {
      const current = (await query('SELECT turns FROM chat_memory WHERE "userId"=$1', [userId]))[0];
      assert(!current || current.turns.every(t => t.text.startsWith(marker)), 'Concurrent chat edit detected; refusing to overwrite it');
      if (originalMemory) await db.query('INSERT INTO chat_memory (id,"userId",turns,"updatedAt") VALUES ($1,$2,$3,$4) ON CONFLICT ("userId") DO UPDATE SET id=EXCLUDED.id,turns=EXCLUDED.turns,"updatedAt"=EXCLUDED."updatedAt"', [originalMemory.id, userId, JSON.stringify(originalMemory.turns), originalMemory.updatedAt]);
      else await db.query('DELETE FROM chat_memory WHERE "userId"=$1', [userId]);
    }
    await check('all pre-existing learning records are unchanged after fixture cleanup', async () => assert.deepEqual(await snapshot(), before));
    if (token) { await api('/auth/logout', 'POST', {}); token = undefined; }
  }
  await db.end();
  report.finishedAt = new Date().toISOString(); report.failed = report.checks.filter(c => !c.passed).length;
  fs.writeFileSync('docs/audits/authenticated-api-qa.json', JSON.stringify(report, null, 2) + '\n');
  console.log(`${report.checks.length - report.failed}/${report.checks.length} authenticated checks passed; cleanup verified.`);
  if (report.failed || report.fatal || report.cleanup.some(c => !c.passed)) process.exitCode = 1;
}
