/* eslint-disable no-console */
const dns = require('dns');
dns.setDefaultResultOrder?.('ipv4first');

const { Pool } = require('pg');

(async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is missing');

    const pool = new Pool({
      connectionString: url,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    });

    const r1 = await pool.query('select now() as ts');
    console.log('[DB CHECK] connected at:', r1.rows[0].ts);
    await pool.end();
    console.log('[DB CHECK] ✅ OK');
    process.exit(0);
  } catch (err) {
    console.error('[DB CHECK] ❌', err.message);
    process.exit(1);
  }
})();

