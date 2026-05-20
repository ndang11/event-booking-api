import 'dotenv/config';
import pool from '../src/config/db.js';

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id               SERIAL PRIMARY KEY,
    username         VARCHAR(100) UNIQUE NOT NULL,
    email            VARCHAR(255) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    date             TIMESTAMP NOT NULL,
    total_seats      INTEGER NOT NULL CHECK (total_seats > 0),
    available_seats  INTEGER NOT NULL CHECK (available_seats >= 0),
    created_by       INTEGER REFERENCES users(id),
    CONSTRAINT seats_valid CHECK (available_seats <= total_seats)
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id               SERIAL PRIMARY KEY,
    event_id         INTEGER REFERENCES events(id) ON DELETE CASCADE,
    user_id          INTEGER REFERENCES users(id),
    seats_booked     INTEGER NOT NULL CHECK (seats_booked > 0),
    booked_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Indexes for common queries
  CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
  CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
  CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
`;

async function initDb() {
  const client = await pool.connect();
  try {
    console.log('🔧 Initializing database schema...');
    await client.query(schema);
    console.log('✅ Schema created successfully');
  } catch (err) {
    console.error('❌ Failed to initialize schema:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();