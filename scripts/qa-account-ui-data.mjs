import 'dotenv/config';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import pg from 'pg';

const mode = process.argv[2];
assert(['seed', 'verify', 'cleanup'].includes(mode));
const email = process.env.SOMA_QA_EMAIL, password = process.env.SOMA_QA_PASSWORD;
delete process.env.SOMA_QA_EMAIL; delete process.env.SOMA_QA_PASSWORD;
assert(email && password, 'Supply authorized existing account credentials');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const file = 'docs/audits/authenticated-ui-data.json';
const filename = 'SOMA_QA_UI_20261014.docx';
let token;
async function api(route, method = 'GET', body, status = 200) {
  const response = await fetch('http://localhost:4000/api' + route, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), 'User-Agent': 'Soma disposable UI fixture QA' },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });
  const json = await response.json(); assert.equal(response.status, status); return json;
}
const query = async (sql, values = []) => (await db.query(sql, values)).rows;
async function digest() {
  const state = {};
  for (const table of ['personal_docs','personal_questions','quiz_attempts','review_items','study_paths','chat_memory']) {
    state[table] = (await query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) AS rows FROM ${table} t`))[0].rows;
  }
  return createHash('sha256').update(JSON.stringify(state)).digest('hex');
}
try {
  await db.connect();
  const login = await api('/auth/login', 'POST', { email, password }); token = login.token;
  const userId = login.user.id;
  if (mode === 'seed') {
    assert.equal((await query('SELECT id FROM personal_docs WHERE "userId"=$1 AND filename=$2', [userId,filename])).length, 0, 'Existing fixture requires scoped cleanup first');
    const baselineHash = await digest();
    const attemptIds = (await query('SELECT id FROM quiz_attempts WHERE "userId"=$1', [userId])).map(r=>r.id);
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync('docs/audits/fixtures/SOMA_QA_20261014.docx')], { type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }), filename);
    const uploaded = await api('/personal-docs','POST',form,201); assert.equal(uploaded.parsed,2);
    const questions = (await api(`/personal-docs/${uploaded.doc.id}/questions`)).questions;
    const state = { startedAt:new Date().toISOString(), userId, docId:uploaded.doc.id, questionIds:questions.map(q=>q.id), attemptIds, baselineHash };
    fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');
    console.log('Prepared two pending questions for browser review; existing data fingerprint recorded.');
  } else {
    const state = JSON.parse(fs.readFileSync(file)); assert.equal(state.userId,userId);
    if (mode === 'verify') {
      const rows = await query('SELECT id,stem,approved FROM personal_questions WHERE "docId"=$1 AND "userId"=$2',[state.docId,userId]);
      assert.equal(rows.length,2); assert(rows.every(q=>q.approved)); assert(rows.some(q=>q.stem.includes('edited through UI')));
      const attempts = await query('SELECT id,score,total,source,seconds FROM quiz_attempts WHERE "userId"=$1 AND NOT (id=ANY($2::text[]))',[userId,state.attemptIds]);
      assert.equal(attempts.length,1,'Must uniquely identify the attempt made through this browser flow');
      assert.equal(attempts[0].source,'personal'); assert.equal(attempts[0].score,1); assert.equal(attempts[0].total,2);
      const reviews=await query('SELECT "itemKey",reps,lapses FROM review_items WHERE "userId"=$1 AND "itemKey"=ANY($2::text[])',[userId,state.questionIds.map(id=>'personal:'+id)]);
      assert.equal(reviews.length,2); assert(reviews.some(r=>r.reps===1)); assert(reviews.some(r=>r.lapses===1));
      state.verified=true; state.createdAttemptIds=attempts.map(a=>a.id);
      fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');
      console.log('Browser edits, approval, 1/2 quiz score and two review outcomes verified against PostgreSQL.');
    } else {
      assert(state.verified,'Do not remove unknown browser activity');
      const doc=(await query('SELECT filename FROM personal_docs WHERE id=$1 AND "userId"=$2',[state.docId,userId]))[0];
      assert.equal(doc?.filename,filename);
      await api('/personal-docs/'+state.docId,'DELETE');
      await db.query('DELETE FROM quiz_attempts WHERE "userId"=$1 AND id=ANY($2::text[])',[userId,state.createdAttemptIds]);
      assert.equal(await digest(),state.baselineHash,'Pre-existing learning records must match their fingerprint');
      state.cleanedAt=new Date().toISOString(); state.cleanupVerified=true;
      fs.writeFileSync(file,JSON.stringify(state,null,2)+'\n');
      console.log('Removed exactly the UI fixture and its attempt; all pre-existing learning data matches the baseline.');
    }
  }
} finally {
  if(token) await api('/auth/logout','POST',{});
  await db.end();
}
