// Simple in-memory rate limiter
// Limits per IP: messages per minute and per hour

interface RateBucket {
  count: number;
  resetAt: number;
}

const minuteBuckets = new Map<string, RateBucket>();
const hourBuckets = new Map<string, RateBucket>();

const LIMITS = {
  anonymous: { perMinute: 10, perHour: 60 },
  authenticated: { perMinute: 20, perHour: 200 },
};

export function checkRateLimit(
  key: string,
  tier: 'anonymous' | 'authenticated' = 'anonymous',
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const limits = LIMITS[tier];

  // Clean stale entries periodically
  if (Math.random() < 0.01) cleanup(now);

  // Check minute limit
  let minute = minuteBuckets.get(key);
  if (!minute || now > minute.resetAt) {
    minute = { count: 0, resetAt: now + 60_000 };
    minuteBuckets.set(key, minute);
  }
  if (minute.count >= limits.perMinute) {
    return { allowed: false, retryAfterMs: minute.resetAt - now };
  }

  // Check hour limit
  let hour = hourBuckets.get(key);
  if (!hour || now > hour.resetAt) {
    hour = { count: 0, resetAt: now + 3_600_000 };
    hourBuckets.set(key, hour);
  }
  if (hour.count >= limits.perHour) {
    return { allowed: false, retryAfterMs: hour.resetAt - now };
  }

  // Allowed — increment both
  minute.count++;
  hour.count++;
  return { allowed: true };
}

function cleanup(now: number) {
  for (const [key, bucket] of minuteBuckets) {
    if (now > bucket.resetAt) minuteBuckets.delete(key);
  }
  for (const [key, bucket] of hourBuckets) {
    if (now > bucket.resetAt) hourBuckets.delete(key);
  }
}
