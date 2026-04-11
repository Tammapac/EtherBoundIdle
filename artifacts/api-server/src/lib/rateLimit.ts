/**
 * Simple in-memory rate limiter.
 * Tracks request counts per IP/user in sliding windows.
 * No external dependencies — works standalone.
 */
import { type Request, type Response, type NextFunction } from "express";
import { logger } from "./logger.js";

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();

// Periodic cleanup every 60s
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
}, 60_000).unref();

interface RateLimitOptions {
  windowMs: number;   // Window size in ms
  max: number;        // Max requests per window
  keyFn?: (req: Request) => string; // Custom key function
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max, keyFn } = opts;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn
      ? keyFn(req)
      : (req as any).userId || req.ip || "unknown";

    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count++;

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set("Retry-After", String(retryAfter));
      res.status(429).json({
        success: false,
        error: `Rate limit exceeded. Try again in ${retryAfter}s.`,
      });
      return;
    }

    // Add rate limit headers
    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(max - bucket.count));
    next();
  };
}

// Pre-built rate limiters
export const apiRateLimit = rateLimit({
  windowMs: 60_000,  // 1 minute
  max: 300,          // 300 requests per minute per user (5/sec avg)
});

export const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: parseInt(process.env.AUTH_RATE_LIMIT || "60", 10),
  keyFn: (req) => `auth:${req.ip}`,
});

export const fightRateLimit = rateLimit({
  windowMs: 10_000,  // 10 seconds
  max: 10,           // 10 fights per 10s per user (1/sec)
  keyFn: (req) => `fight:${(req as any).userId || req.ip}`,
});

// Socket.IO rate limiter (per-character, for message events)
const socketBuckets = new Map<string, RateBucket>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of socketBuckets) {
    if (v.resetAt <= now) socketBuckets.delete(k);
  }
}, 60_000).unref();

export function checkSocketRate(characterId: string, maxPerMinute = 60): boolean {
  const now = Date.now();
  let bucket = socketBuckets.get(characterId);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 60_000 };
    socketBuckets.set(characterId, bucket);
  }
  bucket.count++;
  return bucket.count <= maxPerMinute;
}
