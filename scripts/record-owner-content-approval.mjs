import 'dotenv/config';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import pg from 'pg';

// Run only after the site owner explicitly approves the existing 106 articles.
const email = process.env.SOMA_QA_EMAIL, password = process.env.SOMA_QA_PASSWORD;
delete process.env.SOMA_QA_EMAIL; delete process.env.SOMA_QA_PASSWORD;
assert(email && password, 'Existing owner account is required');
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
let token;
async function api(route, method = 'GET', body) {
  const response = await fetch('http://localhost:4000/api' + route, {
    method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert(response.ok, `${method} ${route} failed: ${response.status}`); return response.json();
}
async function contentHash() {
  const values = [];
  for (const table of ['pathology_content', 'pathology_citations', 'medical_sources']) {
    values.push((await db.query(`SELECT jsonb_agg(to_jsonb(t) ORDER BY id) AS value FROM ${table} t`)).rows[0].value);
  }
  values.push((await db.query(`SELECT jsonb_agg(to_jsonb(t)-'needsReview'-'updatedAt' ORDER BY id) AS value FROM pathologies t`)).rows[0].value);
  return createHash('sha256').update(JSON.stringify(values)).digest('hex');
}
const report = { authorization: 'Site owner explicitly accepted all 106 current pathology articles in this conversation on 2026-10-14.', approvalKind: 'owner acceptance; not an independent medical review', startedAt: new Date().toISOString(), updated: [] };
try {
  await db.connect();
  const rows = (await db.query('SELECT id,slug,"needsReview" FROM pathologies ORDER BY id')).rows;
  assert.equal(rows.length, 106, 'Unexpected dataset; do not approve new unseen articles');
  const before = await contentHash();
  const login = await api('/auth/login', 'POST', { email, password }); token = login.token;
  for (const row of rows.filter(r => r.needsReview)) {
    const result = await api(`/admin/pathologies/${row.id}/reviewed`, 'PATCH', { needsReview: false });
    assert.equal(result.needsReview, false); report.updated.push(row.id);
  }
  assert.equal((await db.query('SELECT count(*)::int AS count FROM pathologies WHERE "needsReview"')).rows[0].count, 0);
  assert.equal(await contentHash(), before, 'Approval must not alter article text, citations or source verification');
  report.auditEntries = (await db.query(`SELECT count(*)::int AS count FROM audit_logs WHERE "actorId"=$1 AND entity='pathology' AND action='verify' AND "entityId"=ANY($2::text[]) AND after->>'needsReview'='false'`, [login.user.id, report.updated])).rows[0].count;
  assert.equal(report.auditEntries, report.updated.length);
  report.contentUnchanged = true; report.pending = 0;
  console.log(`Recorded owner approval: ${report.updated.length} articles; audit entries verified, content and citations unchanged.`);
} finally {
  if (token) await api('/auth/logout', 'POST', {});
  await db.end(); report.finishedAt = new Date().toISOString();
  fs.writeFileSync('docs/audits/owner-content-approval.json', JSON.stringify(report, null, 2)+'\n');
}
