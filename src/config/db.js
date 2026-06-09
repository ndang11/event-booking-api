import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

console.log('--- DB Connection Debugging ---');
console.log('NODE_ENV:', process.env.NODE_ENV);

let pool = null;

export async function getPool() {
  if (!pool) {
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL for connection');
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      });
    } else if (process.env.DB_HOST) {
      console.log('Using individual DB_* env vars for connection');
      console.log('Target Host:', process.env.DB_HOST);
      console.log('Target Database:', isProduction ? process.env.DB_NAME : (process.env.TEST_DB_NAME || 'test_db'));
      pool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: isProduction ? process.env.DB_NAME : (process.env.TEST_DB_NAME || 'test_db'),
        port: parseInt(process.env.DB_PORT || '5432', 10),
        ssl: { rejectUnauthorized: false },
      });
    } else {
      console.log('Using local Unix socket at /var/run/postgresql');
      pool = new Pool({
        host: '/var/run/postgresql',
        database: isProduction ? process.env.DB_NAME : (process.env.TEST_DB_NAME || 'test_db'),
        user: process.env.DB_USER || 'postgres',
      });
    }
  }
  return pool;
}

export function createPoolClient() {
  return pool.connect();
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
  const p = await getPool();
  if (!_initializedHandler && p) {
    p.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(1);
    });
    _initializedHandler = true;
  }
}