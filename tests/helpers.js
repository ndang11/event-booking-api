import request      from 'supertest';
import app          from '../src/app.js';
import { signToken } from '../src/utils/jwt.js';

export const registerUser = (overrides = {}) =>
  request(app).post('/auth/register').send({
    username: 'testuser',
    email:    'test@example.com',
    password: 'Password1',
    ...overrides,
  });

export const loginUser = ({ email = 'test@example.com', password = 'Password1' } = {}) =>
  request(app).post('/auth/login').send({ email, password });

export const makeToken = (overrides = {}) =>
  signToken({ id: 999, username: 'mock', email: 'mock@test.com', ...overrides });

export const createAndLoginUser = async (overrides = {}) => {
  const res = await registerUser(overrides);
  return { token: res.body.data.token, user: res.body.data.user };
};

export const futureDate = (days = 10) =>
  new Date(Date.now() + days * 86_400_000).toISOString();

export const createEvent = (token, overrides = {}) =>
  request(app)
    .post('/events')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title:       'Test Event',
      description: 'A test event',
      date:        futureDate(10),
      total_seats: 20,
      ...overrides,
    });