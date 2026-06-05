import request from 'supertest';
import app from '../src/app.js';
import { setup, teardown, clearTables } from './setup.js';
export { setup, teardown, clearTables };

export async function registerUser(userData = {}) {
  const uniqueId = Math.random().toString(36).substring(7);
  return await request(app)
    .post('/auth/register')
    .send({
      username: `user_${uniqueId}`,
      email: `test_${uniqueId}@example.com`,
      password: "Password123!",
      ...userData
    });
}

export async function loginUser({ email, password } = {}) {
  return await request(app)
    .post('/auth/login')
    .send({ email, password });
}

export async function createAndLoginUser(overrides = {}) {
  const uniqueId = Math.random().toString(36).substring(7);
  const userPayload = {
    email: `test-${uniqueId}@example.com`,
    password: "Password123!",
    username: "Test User",
    ...overrides
  };

  await registerUser(userPayload);

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email: userPayload.email, password: userPayload.password });

  return {
    token: loginRes.body.data?.token,
    user: loginRes.body.data?.user
  };
}

export async function createEvent(token, overrides = {}) {
  return await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Event',
      description: 'An elegant event description.',
      date: futureDate(5),
      total_seats: 20,
      ...overrides
    });
}

export function futureDate(daysAhead = 1) {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString();
}

export async function book(token, eventId, seats = 1) {
  return await request(app)
    .post(`/events/${eventId}/book`)
    .set('Authorization', `Bearer ${token}`)
    .send({ seats });
}
