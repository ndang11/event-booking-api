import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: isProduction ? process.env.DB_NAME : (process.env.TEST_DB_NAME || 'test_db'),
  port: parseInt(process.env.DB_PORT || '5432', 10),
};

console.log('--- DB Connection Debugging ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Target Host:', dbConfig.host);
console.log('Target Database:', dbConfig.database);

let pool = null;

export async function getPool() {
  if (!pool) {
    const poolConfig = dbConfig.host ? dbConfig : {
      ...dbConfig,
      host: '/var/run/postgresql',
      user: process.env.DB_USER || 'postgres',
      password: undefined,
    };
    pool = new Pool(poolConfig);
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
  if (!_initializedHandler && pool) {
    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
      process.exit(1);
    });
    _initializedHandler = true;
  }
}