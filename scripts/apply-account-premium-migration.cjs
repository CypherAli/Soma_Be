const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { createHash, randomUUID } = require('node:crypto');
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const target = new URL(process.env.DATABASE_URL);
if (process.env.NODE_ENV === 'production' || !['localhost', '127.0.0.1', '[::1]'].includes(target.hostname)) throw Error('Use prisma migrate deploy for a non-local database.');
const name = '20261026010000_account_premium';
const sql = readFileSync(resolve(__dirname, '../prisma/migrations', name, 'migration.sql'), 'utf8');
const checksum = createHash('sha256').update(sql).digest('hex');
(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    await db.query('BEGIN');
    await db.query('SELECT pg_advisory_xact_lock(726035119)');
    const existing = await db.query('SELECT checksum, finished_at FROM _prisma_migrations WHERE migration_name=$1 AND rolled_back_at IS NULL', [name]);
    if (existing.rows.length) {
      if (existing.rows[0].checksum !== checksum || !existing.rows[0].finished_at) throw Error('Migration history needs inspection.');
    } else {
      await db.query(sql);
      await db.query('INSERT INTO _prisma_migrations(id,checksum,migration_name,started_at,finished_at,applied_steps_count) VALUES($1,$2,$3,NOW(),NOW(),1)', [randomUUID(), checksum, name]);
    }
    await db.query('COMMIT');
    console.log('Account Premium migration applied and recorded.');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
  finally { await db.end(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
