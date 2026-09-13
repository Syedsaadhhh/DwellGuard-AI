interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const windowMap = new Map<string, RateLimitRecord>();

/**
 * Basic in-memory rate limiter
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = windowMap.get(key);

  if (!record || now > record.resetAt) {
    windowMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count };
}
