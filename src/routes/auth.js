import { Router } from 'express';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';
import { isValidEmail, isStrongPassword } from '../utils/validation.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { findUserByEmail, createUser } from '../services/authService.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username?.trim())           return sendError(res, 'username is required');
    if (!isValidEmail(email))        return sendError(res, 'A valid email is required');
    if (!isStrongPassword(password)) {
      return sendError(
        res,
        'Password must be at least 8 characters and contain a letter and a digit',
      );
    }

    const existing = await findUserByEmail(email);
    if (existing) return sendError(res, 'Email is already registered', 409);

    const password_hash = await hashPassword(password);
    const user          = await createUser({ username, email, password_hash });
    const token         = signToken({ id: user.id, username: user.username, email: user.email });

    return sendSuccess(res, { user, token }, 201);
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!isValidEmail(email) || !password) {
      return sendError(res, 'Email and password are required');
    }

    const user = await findUserByEmail(email);
    if (!user) return sendError(res, 'Invalid email or password', 401);

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) return sendError(res, 'Invalid email or password', 401);

    const { password_hash: _, ...safeUser } = user;
    const token = signToken({ id: safeUser.id, username: safeUser.username, email: safeUser.email });

    return sendSuccess(res, { user: safeUser, token });
  } catch (err) {
    next(err);
  }
});

export default router;