const CACHE_VERSION = 'v2';

export const cacheGet = (key) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (parsed.cache_version !== CACHE_VERSION) {
      localStorage.removeItem(key);
      return null;
    }

    const age = Date.now() - parsed.timestamp;
    if (age > parsed.ttl) {
      localStorage.removeItem(key);
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.error(`Error reading cache key "${key}":`, error);
    return null;
  }
};

export const cacheSet = (key, data, ttlMs) => {
  try {
    const cacheObj = {
      cache_version: CACHE_VERSION,
      timestamp: Date.now(),
      ttl: ttlMs,
      data: data,
    };
    localStorage.setItem(key, JSON.stringify(cacheObj));
  } catch (error) {
    console.error(`Error setting cache key "${key}":`, error);
  }
};

export const cacheInvalidate = (key) => {
  localStorage.removeItem(key);
};

export const cacheClear = () => {
  // Purge all cached data, but preserve preferences like theme and language
  const keysToPreserve = ['atlas_theme', 'atlas_lang'];
  const keysToRemove = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && !keysToPreserve.includes(key)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => {
    localStorage.removeItem(key);
  });
};
