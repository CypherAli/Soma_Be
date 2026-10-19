import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import pg from 'pg';
import assert from 'node:assert/strict';

// A full backup is restored only into a newly created, private QA database.
// No application connection string or source database contents are changed.
const url = new URL(process.env.DATABASE_URL);
const sourceName = decodeURIComponent(url.pathname.slice(1));
const qaName = `soma_restore_qa_${Date.now()}`;
assert(/^soma_restore_qa_\d+$/.test(qaName) && qaName !== sourceName);
const directory = path.resolve('.backup-qa'), dump = path.join(directory, qaName + '.dump');
// PostgreSQL's Windows CLI uses the active code page for file arguments. Keep
// its argument ASCII and resolve it relative to the inherited Unicode cwd.
const relativeDump = `.backup-qa/${qaName}.dump`;
fs.mkdirSync(directory, { recursive: true });
const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
const restoredUrl = new URL(url); restoredUrl.pathname = '/' + qaName;
const restored = new pg.Client({ connectionString: restoredUrl.toString() });
const report = { startedAt: new Date().toISOString(), target: 'isolated disposable QA database', tables: [], passed: false };
const env = { ...process.env, PGPASSWORD: decodeURIComponent(url.password) };
const connection = ['-h', url.hostname, '-p', url.port || '5432', '-U', decodeURIComponent(url.username)];
async function run(binary, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(`C:/Program Files/PostgreSQL/18/bin/${binary}.exe`, args, { env, windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
    let error = ''; child.stderr.on('data', data => { error += data; }); child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`${binary} exited ${code}: ${error.replaceAll(decodeURIComponent(url.password), '[redacted]')}`)));
  });
}
let created = false, connected = false;
try {
  await db.connect(); await db.query(`CREATE DATABASE "${qaName}"`); created = true;
  await run('pg_dump', [...connection, '-d', sourceName, '-Fc', '--no-owner', '--no-acl', '-f', relativeDump]);
  await run('pg_restore', [...connection, '-d', qaName, '--exit-on-error', '--no-owner', '--no-acl', relativeDump]);
  await restored.connect(); connected = true;
  const tables = (await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name")).rows;
  for (const { table_name: table } of tables) {
    const sql = `SELECT count(*)::int AS count,md5(coalesce(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text)::text,'')) AS fingerprint FROM "${table.replaceAll('"','""')}" t`;
    const source = (await db.query(sql)).rows[0], copy = (await restored.query(sql)).rows[0];
    // Session activity can legitimately change while the user browses. Compare
    // every other table exactly, without printing its data or credential hashes.
    const passed = table === 'sessions' ? source.count === copy.count : source.fingerprint === copy.fingerprint;
    report.tables.push({ table, rows: copy.count, passed }); assert(passed, `Restored table differs: ${table}`);
  }
  report.foreignKeys = (await restored.query("SELECT count(*)::int AS count FROM pg_constraint WHERE contype='f' AND convalidated")).rows[0].count;
  assert.equal(report.foreignKeys, 20); report.backupBytes = fs.statSync(dump).size; report.passed = true;
  console.log(`Full backup/restore passed: ${report.tables.length} tables and ${report.foreignKeys} foreign keys; original database unchanged.`);
} finally {
  if (connected) await restored.end();
  if (created) { assert(/^soma_restore_qa_\d+$/.test(qaName) && qaName !== sourceName); await db.query(`DROP DATABASE "${qaName}" WITH (FORCE)`); }
  await db.end();
  if (fs.existsSync(dump)) { assert(dump.startsWith(directory + path.sep)); fs.unlinkSync(dump); }
  report.cleaned = true; report.finishedAt = new Date().toISOString();
  fs.writeFileSync('docs/audits/backup-restore-qa.json', JSON.stringify(report,null,2)+'\n');
}
