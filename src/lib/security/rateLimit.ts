import Redis from "ioredis";

const inMemory = new Map<string, { count: number; expiresAt: number }>();
const redisUrl = process.env.REDIS_URL;
const redis = redisUrl ? new Redis(redisUrl, { maxRetriesPerRequest: 1 }) : null;

export async function assertRateLimit(params: {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}) {
  if (redis) {
    const redisKey = `ratelimit:${params.key}`;
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, params.windowSeconds);
    }
    if (current > params.maxRequests) {
      throw new Error("Rate limit exceeded");
    }
    return;
  }

  const now = Date.now();
  const existing = inMemory.get(params.key);
  if (!existing || existing.expiresAt < now) {
    inMemory.set(params.key, {
      count: 1,
      expiresAt: now + params.windowSeconds * 1000,
    });
    return;
  }
  existing.count += 1;
  inMemory.set(params.key, existing);
  if (existing.count > params.maxRequests) throw new Error("Rate limit exceeded");
}
