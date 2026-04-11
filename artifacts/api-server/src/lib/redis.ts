/**
 * Redis client — optional caching layer.
 *
 * When REDIS_URL is set, provides get/set/del with JSON serialization.
 * When REDIS_URL is not set, all operations silently no-op (returns null).
 * This means the rest of the code can call cache.get/set unconditionally.
 */
import { logger } from "./logger.js";

interface CacheClient {
  get(key: string): Promise<any | null>;
  set(key: string, value: any, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  isConnected(): boolean;
}

// ── In-memory LRU fallback (no Redis dependency needed) ────────────────────
// Keeps up to MAX_ENTRIES items, evicts oldest on overflow.
const MAX_ENTRIES = 5000;
const store = new Map<string, { value: any; expiresAt: number }>();

function evictExpired() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expiresAt <= now) store.delete(k);
  }
}

// Periodic cleanup every 60s
setInterval(evictExpired, 60_000).unref();

const memoryCache: CacheClient = {
  async get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= Date.now()) { store.delete(key); return null; }
    return entry.value;
  },
  async set(key, value, ttlSeconds = 300) {
    if (store.size >= MAX_ENTRIES) {
      // Evict oldest entry
      const firstKey = store.keys().next().value;
      if (firstKey !== undefined) store.delete(firstKey);
    }
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  },
  async del(key) {
    store.delete(key);
  },
  isConnected() { return true; },
};

// ── Redis client (if REDIS_URL is set) ─────────────────────────────────────
let redisCache: CacheClient | null = null;

async function initRedis(): Promise<CacheClient> {
  const url = process.env.REDIS_URL;
  if (!url) {
    logger.info("No REDIS_URL — using in-memory cache (5000 entries max)");
    return memoryCache;
  }

  try {
    // Dynamic import so the app works without ioredis installed
    const { default: Redis } = await import("ioredis" as any);
    const client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 200, 5000),
      lazyConnect: true,
    });
    await client.connect();
    logger.info("Redis connected");

    const redisCacheImpl: CacheClient = {
      async get(key) {
        try {
          const raw = await client.get(key);
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      },
      async set(key, value, ttlSeconds = 300) {
        try {
          await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
        } catch {}
      },
      async del(key) {
        try { await client.del(key); } catch {}
      },
      isConnected() {
        return client.status === "ready";
      },
    };
    return redisCacheImpl;
  } catch (e: any) {
    logger.warn({ err: e.message }, "Redis init failed — falling back to in-memory cache");
    return memoryCache;
  }
}

// Lazy-init singleton
let cachePromise: Promise<CacheClient> | null = null;

export function getCache(): Promise<CacheClient> {
  if (!cachePromise) cachePromise = initRedis();
  return cachePromise;
}

// Convenience: pre-initialized cache ref for sync access after startup
export let cache: CacheClient = memoryCache;

export async function initCache(): Promise<void> {
  cache = await getCache();
}
