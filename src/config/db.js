import pg from 'pg';
import 'dotenv/config';

let pool = null;

export async function getPool() {
  if (!pool) {
    const { Pool } = pg;
    
    console.log('DB Config - NODE_ENV:', process.env.NODE_ENV);
    console.log('DB Config - DB_HOST:', process.env.DB_HOST);
    console.log('DB Config - DB_USER:', process.env.DB_USER);
    console.log('DB Config - Using TEST_DB_NAME:', !!process.env.TEST_DB_NAME);
    
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 5432;
    const database = process.env.TEST_DB_NAME || process.env.DB_NAME || 'event_booking';
    
    if (!process.env.DB_HOST) {
      pool = new Pool({
        host:     '/var/run/postgresql',
        port:     port,
        database: database,
        user:     process.env.DB_USER || 'postgres',
        max:                 20,
        idleTimeoutMillis:   30_000,
        connectionTimeoutMillis: 2_000,
      });
    } else {
      pool = new Pool({
        host:     host,
        port:     port,
        database: database,
        user:     process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
        max:                 20,
        idleTimeoutMillis:   30_000,
        connectionTimeoutMillis: 2_000,
      });
    }
  }
  return pool;
}

export default {
  query: async (...args) => {
    const p = await getPool();
    return p.query(...args);
  },
  connect: async () => {
    const p = await getPool();
    return p.connect();
  },
  on: async (event, handler) => {
    const p = await getPool();
    return p.on(event, handler);
  },
  end: async () => {
    if (pool) {
      await pool.end();
      pool = null;
    }
  }
};

let _initializedHandler = false;
export async function ensurePoolErrorHandling() {
  if (!_initializedHandler && pool) {
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(1);
    });
    _initializedHandler = true;
  }
}