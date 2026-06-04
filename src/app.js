import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.js';
import eventRoutes from './routes/events.js';
import bookingRoutes from './routes/bookings.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/', (_req, res) => {
  res.json({
    status: "success",
    message: "Welcome to the Event Booking API!",
    timestamp: new Date()
  });
});

app.use('/auth', authRoutes);
app.use('/events', eventRoutes);
app.use('/', bookingRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  (async () => {
    const { getPool, ensurePoolErrorHandling } = await import('./config/db.js');
    const pool = await getPool();
    ensurePoolErrorHandling();

    try {
      await pool.query(`
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
        CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
        CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
        CREATE INDEX IF NOT EXISTS idx_bookings_event ON bookings(event_id);
      `);
      console.log(' Database schema initialized');
    } catch (err) {
      console.error(' Schema initialization failed:', err.message);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Event Booking API running on port ${PORT}`);
    });
  })();
}

export default app;