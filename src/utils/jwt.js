import jwt from 'jsonwebtoken';

const secret    = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

if (!secret) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Sign a JWT for the given user payload.
 * @param   {{ id: number, username: string, email: string }} payload
 * @returns {string} signed token
 */
export const signToken = (payload) =>
  jwt.sign(payload, secret, { expiresIn });

/**
 * Verify and decode a JWT.
 * @param   {string} token
 * @returns {{ id: number, username: string, email: string, iat: number, exp: number }}
 * @throws  {JsonWebTokenError | TokenExpiredError}
 */
export const verifyToken = (token) => jwt.verify(token, secret);