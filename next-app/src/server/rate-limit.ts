import "server-only";
import { tooManyRequests } from "./http";

/**
 * Fixed-window in-memory rate limiter. Good enough for a single instance and
 * as a first line of defence on serverless; critical flows (OTP) also keep
 * attempt counters in the database.
 */
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_KEYS = 50_000;

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  if (!checkRateLimit(key, limit, windowMs).allowed) throw tooManyRequests();
}

export function resetRateLimits() {
  buckets.clear();
}
