import request from 'supertest';
import app from '../src/app.js';
import { registerUser, loginUser } from './helpers.js';

describe('Authentication API', () => {
  it('should register a user and return a JWT upon login', async () => {
    const email = `user-${Date.now()}@example.com`;
    
    const regRes = await registerUser({ email });
    expect(regRes.status).toBe(201);

    const loginRes = await loginUser({ email, password: 'Password123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });

  it('should return 401 Unauthorized for a protected route without a valid token', async () => {
    const res = await request(app).post('/events').send({});
    expect(res.status).toBe(401);
  });
});