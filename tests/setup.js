
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.DB_USER = 'ndang-royalty';

import { getPool } from '../src/config/db.js';

let _pool;
let _poolEnded = false;

export async function setup() {
  _pool = await getPool();
}

export async function teardown() {
  if (_pool && !_poolEnded) {
    await _pool.end();
    _poolEnded = true;
  }
}

export async function clearTables() {
  if (!_pool) return;
  await _pool.query('DELETE FROM bookings');
  await _pool.query('DELETE FROM events');
  await _pool.query('DELETE FROM users');
  await _pool.query('ALTER SEQUENCE users_id_seq RESTART WITH 1');
  await _pool.query('ALTER SEQUENCE events_id_seq RESTART WITH 1');
  await _pool.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
  await _pool.query('TRUNCATE TABLE bookings, events, users RESTART IDENTITY CASCADE;');
}

beforeAll(setup);
afterAll(teardown);
beforeEach(clearTables);