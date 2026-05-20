import pool from '../config/db.js';
import { isPositiveInteger, parsePagination } from '../utils/validation.js';

export async function createBooking(eventId, userId, seats) {
  if (!isPositiveInteger(seats)) {
    const err = new Error('seats must be a positive integer'); err.status = 400; throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      'SELECT * FROM events WHERE id = $1 FOR UPDATE',
      [eventId]
    );

    const event = eventResult.rows[0];
    if (!event) {
      await client.query('ROLLBACK');
      const err = new Error('Event not found'); err.status = 404; throw err;
    }

    if (event.available_seats < seats) {
      await client.query('ROLLBACK');
      const err = new Error(
        `Insufficient seats. Requested: ${seats}, Available: ${event.available_seats}`
      );
      err.status = 409; throw err;
    }

    await client.query(
      'UPDATE events SET available_seats = available_seats - $1 WHERE id = $2',
      [seats, eventId]
    );

    const bookingResult = await client.query(
      `INSERT INTO bookings (event_id, user_id, seats_booked)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [eventId, userId, seats]
    );

    await client.query('COMMIT');
    return { booking: bookingResult.rows[0], event };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getUserBookings(userId, { limit, offset }) {
  const countResult = await pool.query(
    'SELECT COUNT(*) FROM bookings WHERE user_id = $1',
    [userId]
  );
  const total = parseInt(countResult.rows[0].count);

  const result = await pool.query(
    `SELECT b.*, e.title AS event_title, e.date AS event_date,
            e.description AS event_description
     FROM bookings b
     JOIN events e ON b.event_id = e.id
     WHERE b.user_id = $1
     ORDER BY b.booked_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return { bookings: result.rows, total, limit, offset };
}

export async function cancelBooking(bookingId, userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      await client.query('ROLLBACK');
      const err = new Error('Booking not found'); err.status = 404; throw err;
    }

    if (booking.user_id !== userId) {
      await client.query('ROLLBACK');
      const err = new Error('Forbidden: you do not own this booking'); err.status = 403; throw err;
    }

    await client.query('SELECT id FROM events WHERE id = $1 FOR UPDATE', [booking.event_id]);

    await client.query(
      'UPDATE events SET available_seats = available_seats + $1 WHERE id = $2',
      [booking.seats_booked, booking.event_id]
    );

    await client.query('DELETE FROM bookings WHERE id = $1', [bookingId]);

    await client.query('COMMIT');
    return booking;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}