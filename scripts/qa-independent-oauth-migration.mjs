import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const file = 'docs/audits/independent-oauth-migration.json';
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const tables = ['personal_docs', 'personal_questions', 'quiz_attempts', 'review_items', 'study_paths', 'chat_memory'];
async function snapshot() {
  const result = {};
  for (const table of tables) result[table] = (await db.query(`SELECT count(*)::int AS count,md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'')) AS fingerprint FROM ${table} t`)).rows[0];
  return result;
}
await db.connect();
try {
  if (process.argv[2] === '--before') {
    assert(!fs.existsSync(file), 'Preserve original migration snapshot');
    const url = new URL(process.env.DATABASE_URL);
    const dump = `.backup-qa/oauth-identities-before-${Date.now()}.dump`;
    fs.mkdirSync('.backup-qa', { recursive: true });
    await new Promise((resolve, reject) => {
      const child = spawn('C:/Program Files/PostgreSQL/18/bin/pg_dump.exe', [
        '-h', url.hostname, '-p', url.port || '5432', '-U', decodeURIComponent(url.username),
        '-d', decodeURIComponent(url.pathname.slice(1)), '-Fc', '--no-owner', '--no-acl', '-f', dump,
      ], { env: { ...process.env, PGPASSWORD: decodeURIComponent(url.password) }, windowsHide: true, stdio: 'ignore' });
      child.on('error', () => reject(new Error('Could not start database backup')));
      child.on('close', code => code === 0 ? resolve() : reject(new Error('Database backup failed')));
    });
    const users = (await db.query(`SELECT id,md5((to_jsonb(u)-'passwordEmail')::text) AS fingerprint FROM users u ORDER BY id`)).rows;
    fs.writeFileSync(file, JSON.stringify({ beforeAt: new Date().toISOString(), dump, users, learning: await snapshot() }, null, 2) + '\n');
    console.log('Private backup and original account/learning fingerprints captured.');
  } else {
    const report = JSON.parse(fs.readFileSync(file, 'utf8'));
    const users = (await db.query(`SELECT id,md5((to_jsonb(u)-'passwordEmail')::text) AS fingerprint FROM users u ORDER BY id`)).rows;
    for (const original of report.users) assert.deepEqual(users.find(user => user.id === original.id), original, 'Existing account changed');
    assert.deepEqual(await snapshot(), report.learning, 'Existing learning records changed');
    const invalid = (await db.query(`SELECT count(*)::int AS n FROM users WHERE ("passwordHash" IS NOT NULL AND "passwordEmail" IS DISTINCT FROM lower(btrim(email))) OR ("passwordHash" IS NULL AND "passwordEmail" IS NOT NULL)`)).rows[0].n;
    assert.equal(invalid, 0, 'Password identity mapping inconsistent');
    report.verifiedAt = new Date().toISOString(); report.passed = true;
    fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n');
    console.log('Existing accounts, linked provider IDs, passwords and learning records unchanged; password identities valid.');
  }
} finally { await db.end(); }
