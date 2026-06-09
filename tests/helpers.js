import request from 'supertest';
import app from '../src/app.js';
import { getPool } from '../src/config/db.js';
import db from '../src/config/db.js';

export async function setup() {
}

export async function teardown() {
  await db.end();
}

export async function clearTables() {
  const pool = await getPool();
  await pool.query('TRUNCATE TABLE bookings, events, users RESTART IDENTITY CASCADE;');
}

export function futureDate(daysFromNow = 1) {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString();
}

export async function registerUser(userData) {
  return await request(app)
    .post('/auth/register')
    .send({
      username: 'Test User',
      password: 'Password123!',
      ...userData
    });
}

export async function loginUser(credentials) {
  return await request(app)
    .post('/auth/login')
    .send(credentials);
}

export async function createAndLoginUser(userData = {}) {
  const email = userData.email || `user-${Date.now()}@example.com`;
  await registerUser({ email, ...userData });
  const loginRes = await loginUser({ email, password: 'Password123!' });
  return { token: loginRes.body.data.token };
}

export async function createEvent(token, customData = {}) {
  return await request(app)
    .post('/events')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Test Event',
      description: 'Event Description',
      date: new Date(Date.now() + 86400000).toISOString(), 
      total_seats: 10,
      ...customData
    });
}

export async function book(token, eventId, seats) {
  return await request(app)
    .post(`/events/${eventId}/book`)
    .set('Authorization', `Bearer ${token}`)
    .send({ seats });
}