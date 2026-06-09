import 'dotenv/config';

process.env.NODE_ENV = 'test';

import request from 'supertest';
import app from '../src/app.js';
import { createAndLoginUser, createEvent, futureDate, setup, teardown, clearTables } from './helpers.js';

describe('GET /events', () => {
  it('returns an empty list when no events exist', async () => {
    const res = await request(app).get('/events');
    expect(res.status).toBe(200);
    expect(res.body.data.events).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });

  it('returns events with pagination metadata', async () => {
    const { token } = await createAndLoginUser();
    await createEvent(token);
    await createEvent(token, { title: 'Event Two' });

    const res = await request(app).get('/events?limit=1&offset=0');
    expect(res.status).toBe(200);
    expect(res.body.data.events).toHaveLength(1);
    expect(res.body.data.total).toBe(2);
  });

  it('filters by date range', async () => {
    const { token } = await createAndLoginUser();
    await createEvent(token, { date: futureDate(5) });
    await createEvent(token, { title: 'Far Future', date: futureDate(60) });

    const start = futureDate(1);
    const end   = futureDate(20);

    const res = await request(app).get(`/events?start=${start}&end=${end}`);
    expect(res.status).toBe(200);
    expect(res.body.data.events).toHaveLength(1);
    expect(res.body.data.events[0].title).toBe('Test Event');
  });
});

describe('GET /events/:id', () => {
  it('returns event with booking summary', async () => {
    const { token } = await createAndLoginUser();
    const { body: { data: event } } = await createEvent(token);

    const res = await request(app).get(`/events/${event.id}`);
    expect(res.status).toBe(200);
    expect(Number(res.body.data.total_booked)).toBe(0);
  });

  it('returns 404 for an unknown event', async () => {
    const res = await request(app).get('/events/99999');
    expect(res.status).toBe(404);
  });
});

describe('POST /events', () => {
  it('creates an event when authenticated', async () => {
    const { token } = await createAndLoginUser();
    const res = await createEvent(token);
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Test Event');
    expect(res.body.data.available_seats).toBe(10);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/events')
      .send({ title: 'X', date: futureDate(5), total_seats: 10 });
    expect(res.status).toBe(401);
  });

  it('returns 401 with an invalid token', async () => {
    const res = await request(app)
      .post('/events')
      .set('Authorization', 'Bearer bad.token.value')
      .send({ title: 'X', date: futureDate(5), total_seats: 10 });
    expect(res.status).toBe(401);
  });

  it('rejects a past date', async () => {
    const { token } = await createAndLoginUser();
    const res = await createEvent(token, {
      date: new Date(Date.now() - 86_400_000).toISOString(),
    });
    expect(res.status).toBe(400);
  });

  it('rejects non-positive total_seats', async () => {
    const { token } = await createAndLoginUser();
    const res = await createEvent(token, { total_seats: -5 });
    expect(res.status).toBe(400);
  });
});

describe('PUT /events/:id', () => {
  it('lets the creator update the event', async () => {
    const { token } = await createAndLoginUser();
    const { body: { data: event } } = await createEvent(token);

    const res = await request(app)
      .put(`/events/${event.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  it('returns 403 for a non-creator', async () => {
    const { token: ownerToken }  = await createAndLoginUser();
    const { body: { data: event } } = await createEvent(ownerToken);

    const { token: otherToken } = await createAndLoginUser({
      username: 'other',
      email:    'other@example.com',
    });

    const res = await request(app)
      .put(`/events/${event.id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ title: 'Hijacked' });

    expect(res.status).toBe(403);
  });

  it('prevents reducing seats below already-booked count', async () => {
    const { token } = await createAndLoginUser();
    const { body: { data: event } } = await createEvent(token, { total_seats: 10 });

    // Book 5 seats
    await request(app)
      .post(`/events/${event.id}/book`)
      .set('Authorization', `Bearer ${token}`)
      .send({ seats: 5 });

    const res = await request(app)
      .put(`/events/${event.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ total_seats: 3 });

    expect(res.status).toBe(400);
  });
});