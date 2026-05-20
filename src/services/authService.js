import pool from '../config/db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { isValidEmail, isStrongPassword } from '../utils/validation.js';

export async function registerUser({ username, email, password }) {
  if (!username || typeof username !== 'string' || username.trim().length < 2) {
    const err = new Error('Username must be at least 2 characters'); err.status = 400; throw err;
  }
  if (!isValidEmail(email)) {
    const err = new Error('Invalid email format'); err.status = 400; throw err;
  }
  if (!isStrongPassword(password)) {
    const err = new Error('Password must be at least 8 characters and contain a letter and a number'); err.status = 400; throw err;
  }

  const passwordHash = hashPassword(password);

  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, username, email, created_at`,
    [username.trim(), email.toLowerCase(), passwordHash]
  );

  const user = result.rows[0];
  const token = signToken({ userId: user.id });
  return { user, token };
}

export async function loginUser({ email, password }) {
  if (!email || !password) {
    const err = new Error('Email and password are required'); err.status = 400; throw err;
  }

  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  const user = result.rows[0];
  if (!user) {
    const err = new Error('Invalid credentials'); err.status = 401; throw err;
  }

  const valid = verifyPassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials'); err.status = 401; throw err;
  }

  const token = signToken({ userId: user.id });
  const { password_hash, ...safeUser } = user;
  return { user: safeUser, token };
}