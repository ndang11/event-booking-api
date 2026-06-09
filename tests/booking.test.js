import request from 'supertest';
import app from '../src/app.js';
import { createAndLoginUser, createEvent, book } from './helpers.js';

describe('Booking Concurrency & Capacity Systems', () => {
  it('should enforce maximum capacity constraints and reject over-booking', async () => {
    const { token } = await createAndLoginUser();
    
    const eventRes = await createEvent(token, { total_seats: 2 });
    const eventId = eventRes.body.data.id;

    const successfulBook = await book(token, eventId, 2);
    expect(successfulBook.status).toBe(201);

    const overCapacityBook = await book(token, eventId, 1);
    expect(overCapacityBook.status).toBe(409);
  });

  it('should safely handle concurrent bookings against a single remaining seat', async () => {
    const { token } = await createAndLoginUser();
    
    const eventRes = await createEvent(token, { total_seats: 1 });
    const eventId = eventRes.body.data.id;

    const raceRequests = await Promise.all([
      book(token, eventId, 1),
      book(token, eventId, 1)
    ]);

    const statuses = raceRequests.map(res => res.status);
    
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });
});