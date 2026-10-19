import 'dotenv/config';
import fs from 'node:fs';
import pg from 'pg';
import { Prisma } from '@prisma/client';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const quote = name => '"' + name.replaceAll('"', '""') + '"';
const report = { startedAt: new Date().toISOString(), checks: [], tables: [], foreignKeys: [] };
const check = (name, issues, detail) => report.checks.push({ name, passed: issues === 0, issues, detail });
const count = async sql => Number((await client.query(sql)).rows[0].count);
try {
  await client.connect();
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  await client.query("SET LOCAL statement_timeout = '15s'");
  report.server = (await client.query("SELECT current_setting('server_version') AS version,pg_database_size(current_database()) AS bytes,current_setting('TimeZone') AS timezone")).rows[0];
  const columns = (await client.query("SELECT table_name,column_name,is_nullable,data_type,udt_name FROM information_schema.columns WHERE table_schema='public'")).rows;
  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  const actualTables = new Set(columns.map(row => row.table_name));
  const missingColumns = [], missingTables = [], nullableMismatch = [], typeMismatch = [];
  const types = { String: 'text', Int: 'integer', Float: 'double precision', Boolean: 'boolean', DateTime: 'timestamp without time zone', Json: 'jsonb', BigInt: 'bigint', Bytes: 'bytea' };
  for (const model of Prisma.dmmf.datamodel.models) {
    // Prisma 7's compact runtime DMMF omits optional/list flags. Read those
    // from the actual schema instead of interpreting missing flags as false.
    const body = schema.match(new RegExp(`model\\s+${model.name}\\s*\\{([\\s\\S]*?)^\\}`, 'm'))?.[1] || '';
    const table = model.dbName || model.name;
    if (!actualTables.has(table)) { missingTables.push(table); continue; }
    for (const field of model.fields.filter(field => field.kind !== 'object')) {
      const column = field.dbName || field.name;
      const declaration = body.match(new RegExp(`^\\s*${field.name}\\s+(\\w+)(\\[\\])?(\\?)?`, 'm'));
      if (!declaration) throw new Error(`Missing declaration: ${model.name}.${field.name}`);
      const isList = Boolean(declaration[2]), required = !declaration[3];
      const row = columns.find(row => row.table_name === table && row.column_name === column);
      if (!row) { missingColumns.push(`${table}.${column}`); continue; }
      // PostgreSQL list columns may be nullable; Prisma reads null as an empty
      // list. Its migrations don't enforce scalar NOT NULL semantics on lists.
      if (!isList && (row.is_nullable === 'NO') !== required) nullableMismatch.push(`${table}.${column}`);
      const expected = isList ? 'ARRAY' : field.kind === 'enum' ? 'USER-DEFINED' : types[field.type];
      if (expected && row.data_type !== expected) typeMismatch.push({ column: `${table}.${column}`, expected, actual: row.data_type });
    }
  }
  check('Prisma tables exist', missingTables.length, missingTables);
  check('Prisma scalar columns exist', missingColumns.length, missingColumns);
  check('Required and nullable columns match Prisma', nullableMismatch.length, nullableMismatch);
  check('Scalar column types match Prisma', typeMismatch.length, typeMismatch);
  for (const table of [...actualTables].sort()) report.tables.push({ table, rows: await count(`SELECT count(*) FROM public.${quote(table)}`) });
  const foreignKeys = (await client.query(`SELECT c.conname,c.convalidated,child.relname AS child,parent.relname AS parent,
    array_agg(ca.attname::text ORDER BY pairs.ordinality) AS child_columns,array_agg(pa.attname::text ORDER BY pairs.ordinality) AS parent_columns
    FROM pg_constraint c JOIN pg_class child ON child.oid=c.conrelid JOIN pg_class parent ON parent.oid=c.confrelid
    JOIN pg_namespace ns ON ns.oid=child.relnamespace
    CROSS JOIN LATERAL unnest(c.conkey,c.confkey) WITH ORDINALITY AS pairs(child_att,parent_att,ordinality)
    JOIN pg_attribute ca ON ca.attrelid=child.oid AND ca.attnum=pairs.child_att
    JOIN pg_attribute pa ON pa.attrelid=parent.oid AND pa.attnum=pairs.parent_att
    WHERE c.contype='f' AND ns.nspname='public' GROUP BY c.conname,c.convalidated,child.relname,parent.relname`)).rows;
  for (const fk of foreignKeys) {
    const join = fk.child_columns.map((column, index) => `p.${quote(fk.parent_columns[index])}=c.${quote(column)}`).join(' AND ');
    const present = fk.child_columns.map(column => `c.${quote(column)} IS NOT NULL`).join(' AND ');
    const orphans = await count(`SELECT count(*) FROM public.${quote(fk.child)} c WHERE ${present} AND NOT EXISTS (SELECT 1 FROM public.${quote(fk.parent)} p WHERE ${join})`);
    report.foreignKeys.push({ name: fk.conname, validated: fk.convalidated, orphans });
  }
  check('Foreign keys have no orphan rows', report.foreignKeys.reduce((total, fk) => total + fk.orphans, 0));
  check('Foreign keys are validated', foreignKeys.filter(fk => !fk.convalidated).length);
  const invalidIndexes = (await client.query(`SELECT indexrelid::regclass::text AS name FROM pg_index i JOIN pg_class t ON t.oid=i.indrelid JOIN pg_namespace n ON n.oid=t.relnamespace WHERE n.nspname='public' AND (NOT i.indisvalid OR NOT i.indisready)`)).rows;
  check('All indexes are valid and ready', invalidIndexes.length, invalidIndexes);
  const migrations = (await client.query('SELECT migration_name,finished_at,rolled_back_at FROM "_prisma_migrations" ORDER BY started_at')).rows;
  const expectedMigrations = fs.readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name);
  const completed = new Set(migrations.filter(row => row.finished_at && !row.rolled_back_at).map(row => row.migration_name));
  const pending = expectedMigrations.filter(name => !completed.has(name));
  check('Repository migrations are applied', pending.length, pending);
  check('No unfinished failed migrations', migrations.filter(row => !row.finished_at && !row.rolled_back_at).length);
  report.migrations = { repository: expectedMigrations.length, completed: completed.size };
  const domains = [
    ['Contact emails are normalized and password identities are unique and consistent', 'SELECT count(*) FROM (SELECT lower("passwordEmail") FROM users WHERE "passwordEmail" IS NOT NULL GROUP BY lower("passwordEmail") HAVING count(*)>1 UNION ALL SELECT email FROM users WHERE email<>lower(trim(email)) OR ("passwordHash" IS NOT NULL AND "passwordEmail" IS DISTINCT FROM email) OR ("passwordHash" IS NULL AND "passwordEmail" IS NOT NULL)) violations'],
    ['Active sessions do not belong to disabled accounts', 'SELECT count(*) FROM sessions s JOIN users u ON u.id=s."userId" WHERE u."disabledAt" IS NOT NULL AND s."expiresAt">now()'],
    ['Session lifetimes are valid', 'SELECT count(*) FROM sessions WHERE "expiresAt"<="createdAt"'],
    ['Quiz scores and durations are in range', 'SELECT count(*) FROM quiz_attempts WHERE total<1 OR score<0 OR score>total OR seconds<0'],
    ['Study path limits are valid', 'SELECT count(*) FROM study_paths WHERE "daysPerWeek"<1 OR "daysPerWeek">7 OR "minutesPerDay"<10 OR "minutesPerDay">180 OR "horizonDays"<1 OR "horizonDays">366'],
    ['Review counters and intervals are nonnegative', 'SELECT count(*) FROM review_items WHERE reps<0 OR lapses<0 OR "intervalDays"<0 OR ease<1.3'],
    ['Personal questions belong to the same owner as their document', 'SELECT count(*) FROM personal_questions q LEFT JOIN personal_docs d ON d.id=q."docId" WHERE d.id IS NULL OR q."userId"<>d."userId"'],
    ['Personal document sizes and statuses are valid', `SELECT count(*) FROM personal_docs WHERE bytes<0 OR pages<0 OR status NOT IN ('processing','ready','failed')`],
    ['Personal question options are objects with a valid answer key', `SELECT count(*) FROM personal_questions WHERE jsonb_typeof(options)<>'object' OR NOT options ? answer`],
    ['Quiz bank entries have options and a correct answer', 'SELECT count(*) FROM quiz_questions q WHERE (SELECT count(*) FROM quiz_options o WHERE o."questionId"=q.id)<2 OR NOT EXISTS (SELECT 1 FROM quiz_options o WHERE o."questionId"=q.id AND o."isCorrect")'],
    ['Structure parents have matching species', 'SELECT count(*) FROM structures s JOIN structures p ON p.id=s."parentId" WHERE s."speciesId"<>p."speciesId"'],
    ['Structure hierarchy has no cycle', `WITH RECURSIVE walk AS (SELECT id,"parentId",ARRAY[id] AS visited,false AS cycle FROM structures UNION ALL SELECT p.id,p."parentId",w.visited||p.id,p.id=ANY(w.visited) FROM walk w JOIN structures p ON p.id=w."parentId" WHERE NOT w.cycle) SELECT count(*) FROM walk WHERE cycle`],
    ['Personal review items still reference an existing approved question', `SELECT count(*) FROM review_items r WHERE r.source='personal' AND NOT EXISTS (SELECT 1 FROM personal_questions q WHERE r."itemKey"='personal:'||q.id AND r."userId"=q."userId" AND q.approved)`],
  ];
  for (const [name, sql] of domains) check(name, await count(sql));
  report.sessionSummary = (await client.query('SELECT count(*) AS total,count(*) FILTER(WHERE "expiresAt">now()) AS active,count(*) FILTER(WHERE "expiresAt"<=now()) AS expired FROM sessions')).rows[0];
  report.contentReview = (await client.query('SELECT count(*) AS total,count(*) FILTER(WHERE "needsReview") AS pending FROM pathologies')).rows[0];
} finally {
  await client.query('ROLLBACK').catch(() => undefined);
  await client.end();
}
report.finishedAt = new Date().toISOString();
report.failures = report.checks.filter(check => !check.passed);
fs.mkdirSync('docs/audits', { recursive: true });
fs.writeFileSync('docs/audits/database-audit.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ tables: report.tables, foreignKeys: report.foreignKeys.length, checks: report.checks.length, failures: report.failures, migrations: report.migrations, sessions: report.sessionSummary, contentReview: report.contentReview }, null, 2));
if (report.failures.length) process.exitCode = 1;
