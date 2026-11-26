import crypto from "crypto";

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;

  const actualBuf = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHex, "hex");

  if (actualBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(actualBuf, expectedBuf);
}

/**
 * Strips spaces, dashes, parentheses, and leading '+' so phone numbers
 * like '+998 90 123-45-67' and '998901234567' match consistently.
 */
export function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/\D/g, "");
}

export function isValidPhone(rawPhone: string): boolean {
  const digits = normalizePhone(rawPhone);
  return digits.length >= 7 && digits.length <= 15;
}

export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_.-]{3,30}$/.test(username.trim());
}
