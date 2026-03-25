// Simple in-memory rate limiter
// Limits per IP: messages per minute and per hour

interface RateBucket {
  count: number;
  resetAt: number;
}

const minuteBuckets = new Map<string, RateBucket>();
const hourBuckets = new Map<string, RateBucket>();

const LIMITS = {
  perMinute: 10, // max 10 messages per minute per IP
  perHour: 60, // max 60 messages per hour per IP
};

export function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();

  // Clean stale entries periodically
  if (Math.random() < 0.01) cleanup(now);

  // Check minute limit
  let minute = minuteBuckets.get(ip);
  if (!minute || now > minute.resetAt) {
    minute = { count: 0, resetAt: now + 60_000 };
    minuteBuckets.set(ip, minute);
  }
  if (minute.count >= LIMITS.perMinute) {
    return { allowed: false, retryAfterMs: minute.resetAt - now };
  }

  // Check hour limit
  let hour = hourBuckets.get(ip);
  if (!hour || now > hour.resetAt) {
    hour = { count: 0, resetAt: now + 3_600_000 };
    hourBuckets.set(ip, hour);
  }
  if (hour.count >= LIMITS.perHour) {
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
