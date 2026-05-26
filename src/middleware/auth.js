import { verifyToken } from '../utils/jwt.js';
import { sendError }   from '../utils/response.js';

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 'Authorization header missing or malformed', 401);
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token';
    return sendError(res, message, 401);
  }
};

export default authenticate;