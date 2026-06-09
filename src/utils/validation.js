const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email) =>
  typeof email === 'string' && EMAIL_RE.test(email.trim());

export const isStrongPassword = (password) =>
  typeof password === 'string' &&
  password.length >= 8 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

export const isFutureDate = (dateStr) => {
  const d = new Date(dateStr);
  return !Number.isNaN(d.getTime()) && d.getTime() > Date.now();
};

export const toPositiveInt = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : NaN;
};

export const isPositiveInteger = (value) =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value > 0;

export const parsePagination = (query) => {
  const limit  = Math.min(Math.max(toPositiveInt(query.limit)  || 20, 1), 100);
  const offset = Math.max(toPositiveInt(query.offset) || 0, 0);
  return { limit, offset };
};