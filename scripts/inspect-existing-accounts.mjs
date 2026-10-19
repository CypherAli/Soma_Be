import 'dotenv/config';
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const accounts = await client.query(`SELECT id,name,email,role,plan,
    "disabledAt" IS NOT NULL AS disabled,
    "passwordHash" IS NOT NULL AS has_password FROM users ORDER BY "createdAt"`);
  console.log(JSON.stringify(accounts.rows, null, 2));
} finally {
  await client.query('ROLLBACK').catch(() => undefined);
  await client.end();
}
