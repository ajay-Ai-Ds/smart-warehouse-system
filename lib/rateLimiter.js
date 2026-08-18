/**
 * Smart Warehouse System — Rate Limiter
 *
 * Lightweight in-memory sliding window rate limiter to protect sensitive
 * API endpoints (order creation, allocation, telemetry polling) against
 * denial-of-service, abusive request spikes, and brute force spam.
 *
 * @module rateLimiter
 */

/**
 * Storage map for rate limit timestamps per client key.
 * @type {Map<string, number[]>}
 */
const rateLimitMap = new Map();

/**
 * Periodically purge stale entries from the in-memory map to prevent memory leak.
 */
const CLEANUP_INTERVAL_MS = 60000;
let lastCleanup = Date.now();

export function purgeStaleEntries(windowMs = 60000, force = false) {
  const now = Date.now();
  if (!force && now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, timestamps] of rateLimitMap.entries()) {
    const valid = timestamps.filter((t) => now - t < windowMs);
    if (valid.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, valid);
    }
  }
}

/**
 * Checks if a client identifier is within the allowed request rate.
 *
 * @param {string} identifier - Unique client ID (e.g. IP or token).
 * @param {number} [maxRequests=30] - Maximum allowed requests in the time window.
 * @param {number} [windowMs=60000] - Time window in milliseconds (default 1 minute).
 * @returns {{
 *   success: boolean,
 *   limit: number,
 *   remaining: number,
 *   reset: number
 * }} Rate limit status object.
 */
export function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  if (!identifier || typeof identifier !== 'string') {
    identifier = 'anonymous';
  }

  const now = Date.now();
  purgeStaleEntries(windowMs);

  const timestamps = rateLimitMap.get(identifier) || [];
  const validTimestamps = timestamps.filter((t) => now - t < windowMs);

  if (validTimestamps.length >= maxRequests) {
    const oldestTimestamp = validTimestamps[0] || now;
    const resetTime = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.max(1, resetTime),
    };
  }

  validTimestamps.push(now);
  rateLimitMap.set(identifier, validTimestamps);

  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - validTimestamps.length,
    reset: Math.ceil(windowMs / 1000),
  };
}

/**
 * Resets rate limit store (useful for automated testing).
 */
export function resetRateLimits() {
  rateLimitMap.clear();
}
