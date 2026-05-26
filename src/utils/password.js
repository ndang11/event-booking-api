import { randomBytes, pbkdf2, pbkdf2Sync } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2Async = promisify(pbkdf2);

const ITERATIONS = 310_000;
const KEY_LEN = 64;
const DIGEST = 'sha512';
const ENCODING = 'hex';

export async function hashPassword(password) {
  const salt = randomBytes(32).toString('hex');
  const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return `${salt}:${hash.toString(ENCODING)}`;
}

export async function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(':');
  if (!salt || !storedHash) return false;
  const hash = await pbkdf2Async(password, salt, ITERATIONS, KEY_LEN, DIGEST);
  return hash.toString(ENCODING) === storedHash;
}

export function hashPasswordSync(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 10_000, KEY_LEN, DIGEST);
  return `${salt}:${hash.toString(ENCODING)}`;
}