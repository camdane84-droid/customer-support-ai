import type { NextRequest } from 'next/server';

/**
 * Fixed-window in-memory rate limiter for public endpoints.
 *
 * Per-instance only: on serverless each warm instance keeps its own counters,
 * so the effective global limit is (limit × instances). That still stops the
 * cheap attacks — a single client hammering one instance — without adding a
 * Redis dependency. Revisit with a durable store if abuse shows up in logs.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

/**
 * Count a hit against `key`. Returns true when the request is allowed,
 * false once `limit` hits have landed inside the current window.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size >= MAX_BUCKETS) sweepExpired(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  return bucket.count <= limit;
}

/** Best-effort client IP: first hop of x-forwarded-for (set by Vercel/proxies). */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}
