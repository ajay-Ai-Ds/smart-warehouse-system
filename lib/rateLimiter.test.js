import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit, resetRateLimits, purgeStaleEntries } from './rateLimiter.js';

test('rateLimiter - allows requests within allowed limit', () => {
  resetRateLimits();
  const res1 = checkRateLimit('client-1', 5, 10000);
  assert.equal(res1.success, true);
  assert.equal(res1.remaining, 4);
  assert.equal(res1.limit, 5);

  const res2 = checkRateLimit('client-1', 5, 10000);
  assert.equal(res2.success, true);
  assert.equal(res2.remaining, 3);
});

test('rateLimiter - rejects requests when limit is exceeded', () => {
  resetRateLimits();
  for (let i = 0; i < 3; i++) {
    const res = checkRateLimit('client-flood', 3, 10000);
    assert.equal(res.success, true);
  }

  const blocked = checkRateLimit('client-flood', 3, 10000);
  assert.equal(blocked.success, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.reset > 0);
});

test('rateLimiter - isolates rates by client identifier', () => {
  resetRateLimits();
  for (let i = 0; i < 2; i++) {
    checkRateLimit('client-a', 2, 10000);
  }
  const blockedA = checkRateLimit('client-a', 2, 10000);
  assert.equal(blockedA.success, false);

  const allowedB = checkRateLimit('client-b', 2, 10000);
  assert.equal(allowedB.success, true);
});

test('rateLimiter - handles invalid or empty identifier gracefully', () => {
  resetRateLimits();
  const resNull = checkRateLimit(null, 5, 10000);
  assert.equal(resNull.success, true);

  const resEmpty = checkRateLimit('', 5, 10000);
  assert.equal(resEmpty.success, true);
});

test('rateLimiter - purgeStaleEntries cleans expired records and keeps valid records', () => {
  resetRateLimits();
  checkRateLimit('client-purge', 5, 100000);
  purgeStaleEntries(100000, true);
  const remaining = checkRateLimit('client-purge', 5, 100000);
  assert.equal(remaining.remaining, 3);
});
