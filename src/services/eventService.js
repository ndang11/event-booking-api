import pool from '../config/db.js';
import { isFutureDate, isPositiveInteger, parsePagination } from '../utils/validation.js';

export async function listEvents({ start, end, limit, offset }) {
  const params = [];
  let where = '';

  if (start && end) {
    params.push(new Date(start).toISOString(), new Date(end).toISOString());
    where = `WHERE date BETWEEN $1 AND $2`;
  } else if (start) {
    params.push(new Date(start).toISOString());
    where = `WHERE date >= $1`;
  } else if (end) {
    params.push(new Date(end).toISOString());
    where = `WHERE date <= $1`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM events ${where}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const result = await pool.query(
    `SELECT e.*, u.username AS creator_username
     FROM events e
     LEFT JOIN users u ON e.created_by = u.id
     ${where}
     ORDER BY e.date ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  return { events: result.rows, total, limit, offset };
}

export async function getEventById(eventId) {
  const result = await pool.query(
    `SELECT e.*, u.username AS creator_username,
            COALESCE(SUM(b.seats_booked), 0) AS total_booked
     FROM events e
     LEFT JOIN users u ON e.created_by = u.id
     LEFT JOIN bookings b ON e.id = b.event_id
     WHERE e.id = $1
     GROUP BY e.id, u.username`,
    [eventId]
  );

  if (!result.rows[0]) {
    const err = new Error('Event not found'); err.status = 404; throw err;
  }
  return result.rows[0];
}

export async function createEvent({ title, description, date, total_seats, createdBy }) {
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    const err = new Error('Title is required'); err.status = 400; throw err;
  }
  if (!date || !isFutureDate(date)) {
    const err = new Error('Event date must be a valid future date'); err.status = 400; throw err;
  }
  if (!isPositiveInteger(total_seats)) {
    const err = new Error('total_seats must be a positive integer'); err.status = 400; throw err;
  }

  const result = await pool.query(
    `INSERT INTO events (title, description, date, total_seats, available_seats, created_by)
     VALUES ($1, $2, $3, $4, $4, $5)
     RETURNING *`,
    [title.trim(), description || null, new Date(date).toISOString(), total_seats, createdBy]
  );

  return result.rows[0];
}

export async function updateEvent(eventId, userId, updates) {
  const existing = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
  if (!existing.rows[0]) {
    const err = new Error('Event not found'); err.status = 404; throw err;
  }

  const event = existing.rows[0];
  if (event.created_by !== userId) {
    const err = new Error('Forbidden: you are not the creator of this event'); err.status = 403; throw err;
  }

  if (updates.total_seats !== undefined) {
    if (!isPositiveInteger(updates.total_seats)) {
      const err = new Error('total_seats must be a positive integer'); err.status = 400; throw err;
    }
    const bookedResult = await pool.query(
      'SELECT COALESCE(SUM(seats_booked), 0) AS booked FROM bookings WHERE event_id = $1',
      [eventId]
    );
    const alreadyBooked = parseInt(bookedResult.rows[0].booked);
    if (updates.total_seats < alreadyBooked) {
      const err = new Error(`Cannot reduce total_seats below already booked seats (${alreadyBooked})`);
      err.status = 400; throw err;
    }
    
    const currentlyAvailable = event.available_seats;
    const seatDelta = updates.total_seats - event.total_seats;
    updates.available_seats = currentlyAvailable + seatDelta;
  }

  if (updates.date !== undefined && !isFutureDate(updates.date)) {
    const err = new Error('Event date must be a valid future date'); err.status = 400; throw err;
  }

  const fields = [];
  const values = [];
  let idx = 1;

  const allowed = ['title', 'description', 'date', 'total_seats', 'available_seats'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx}`);
      values.push(key === 'date' ? new Date(updates[key]).toISOString() : updates[key]);
      idx++;
    }
  }

  if (fields.length === 0) {
    const err = new Error('No valid fields to update'); err.status = 400; throw err;
  }

  values.push(eventId);
  const result = await pool.query(
    `UPDATE events SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
    values
  );

  return result.rows[0];
}