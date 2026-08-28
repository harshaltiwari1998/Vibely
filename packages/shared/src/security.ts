/** Security constants and helpers shared across services and clients. */

export const SECURITY = {
  /** Minimum allowed age to register (safety / age restriction). */
  MIN_AGE_YEARS: 18,
  /** Maximum reasonable age used for validation. */
  MAX_AGE_YEARS: 120,
  /** Minimum password length. */
  MIN_PASSWORD_LENGTH: 8,
  /** Maximum failed login attempts before throttle. */
  MAX_LOGIN_ATTEMPTS: 5,
  /** Account lockout window in seconds. */
  LOCKOUT_SECONDS: 900,
  /** Refresh token rotation enforced. */
  ROTATE_REFRESH_TOKEN: true,
} as const;

/** Keys that must NEVER be written to logs. */
const SECRET_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /private/i,
  /credential/i,
  /card/i,
  /payment/i,
];

export function isSensitiveKey(key: string): boolean {
  return SECRET_KEY_PATTERNS.some((re) => re.test(key));
}

/**
 * Recursively redact sensitive values from an object so it is safe to log.
 * Returns a deep clone; the original is never mutated.
 */
export function redactSensitive<T>(input: T, seen = new WeakSet<object>()): T {
  if (input === null || input === undefined) return input;
  if (typeof input !== "object") return input;

  if (seen.has(input as object)) return "[Circular]" as unknown as T;
  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map((v) => redactSensitive(v, seen)) as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (isSensitiveKey(k)) {
      out[k] = typeof v === "string" || typeof v === "number" ? "***REDACTED***" : v;
    } else if (typeof v === "object" && v !== null) {
      out[k] = redactSensitive(v, seen);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

/** Validate that a plain password meets the platform policy. */
export function isValidPassword(password: string): boolean {
  if (typeof password !== "string") return false;
  if (password.length < SECURITY.MIN_PASSWORD_LENGTH) return false;
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return false;
  return true;
}

/** Compute age in whole years from an ISO date-of-birth string. */
export function ageFromDateOfBirth(dob: string | Date): number {
  const birth = typeof dob === "string" ? new Date(dob) : dob;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}
