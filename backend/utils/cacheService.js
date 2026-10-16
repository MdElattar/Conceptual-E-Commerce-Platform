import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || process.env.REDIS_TLS_URL || '';

let client = null;
let isConnected = false;

export function initCache() {
  if (!REDIS_URL) {
    console.log('Cache: No REDIS_URL configured, caching disabled.');
    return null;
  }

  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  client.on('connect', () => { isConnected = true; });
  client.on('close', () => { isConnected = false; });
  client.on('error', () => { isConnected = false; });

  return client;
}

export function isCacheReady() {
  return client && isConnected;
}

export async function get(key) {
  if (!isCacheReady()) return null;
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function set(key, data, ttlSeconds = 300) {
  if (!isCacheReady()) return;
  try {
    const serialized = JSON.stringify(data);
    if (ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, serialized);
    } else {
      await client.set(key, serialized);
    }
  } catch {
    // Silently fail — cache miss is fine
  }
}

export async function del(key) {
  if (!isCacheReady()) return;
  try {
    await client.del(key);
  } catch {
    // Silently fail
  }
}

export async function delPattern(pattern) {
  if (!isCacheReady()) return;
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  } catch {
    // Silently fail
  }
}

export async function closeCache() {
  if (client) {
    await client.quit();
    client = null;
    isConnected = false;
  }
}
