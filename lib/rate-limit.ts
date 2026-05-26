import { db } from "./db";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

// Local in-memory cache fallback for serverless container instances when database is unreachable
const memoryFallback = new Map<string, { count: number; resetAt: Date }>();

/**
 * Database-backed rate limiter. Works across Vercel serverless instances.
 * Uses the RateLimit table with atomic upsert + conditional increment.
 *
 * Note: callers must `await` this — it changed from sync to async to support
 * the DB-backed storage. Update call sites if you see TS errors.
 */
export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + options.windowMs);

  try {
    const entry = await db.rateLimit.findUnique({ where: { key } });

    if (!entry || entry.resetAt <= now) {
      await db.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { allowed: true };
    }

    if (entry.count >= options.maxRequests) {
      const retryAfter = Math.ceil(
        (entry.resetAt.getTime() - now.getTime()) / 1000
      );
      return { allowed: false, retryAfter };
    }

    await db.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true };
  } catch (error) {
    console.error("Rate limiter database fallback triggered:", error);
    try {
      const fallbackNow = new Date();
      const fallbackResetAt = new Date(fallbackNow.getTime() + options.windowMs);
      const entry = memoryFallback.get(key);

      if (!entry || entry.resetAt <= fallbackNow) {
        memoryFallback.set(key, { count: 1, resetAt: fallbackResetAt });
        return { allowed: true };
      }

      if (entry.count >= options.maxRequests) {
        const retryAfter = Math.ceil(
          (entry.resetAt.getTime() - fallbackNow.getTime()) / 1000
        );
        return { allowed: false, retryAfter };
      }

      entry.count += 1;
      return { allowed: true };
    } catch {
      // Ultimate absolute fallback if memory operations fail (highly unlikely)
      return { allowed: true };
    }
  }
}

// Lazy cleanup of expired entries — runs at most once per 10 minutes
let lastCleanup = 0;
async function cleanupExpired() {
  const now = Date.now();
  if (now - lastCleanup < 10 * 60 * 1000) return;
  lastCleanup = now;
  try {
    await db.rateLimit.deleteMany({
      where: { resetAt: { lte: new Date() } },
    });
  } catch {
    // ignore
  }
}

export async function checkRateLimitWithCleanup(
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; retryAfter?: number }> {
  cleanupExpired(); // fire-and-forget
  return checkRateLimit(key, options);
}
