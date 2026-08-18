import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDeadlineCountdown,
  sanitizeString,
  formatINR,
  clamp
} from './utils.js';

test('getDeadlineCountdown - handles null or empty deadline', () => {
  assert.equal(getDeadlineCountdown(null), 'No deadline');
  assert.equal(getDeadlineCountdown(undefined), 'No deadline');
  assert.equal(getDeadlineCountdown(''), 'No deadline');
});

test('getDeadlineCountdown - handles past overdue deadline', () => {
  const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
  assert.equal(getDeadlineCountdown(pastDate), 'OVERDUE');
});

test('getDeadlineCountdown - returns minutes remaining when under 1 hour', () => {
  const futureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const text = getDeadlineCountdown(futureDate);
  assert.ok(text.includes('m remaining'));
});

test('getDeadlineCountdown - returns hours and minutes when under 24 hours', () => {
  const futureDate = new Date(Date.now() + (3 * 3600 + 20 * 60) * 1000).toISOString();
  const text = getDeadlineCountdown(futureDate);
  assert.ok(text.includes('h ') && text.includes('m remaining'));
});

test('getDeadlineCountdown - returns days and hours when over 24 hours', () => {
  const futureDate = new Date(Date.now() + (48 * 3600) * 1000).toISOString();
  const text = getDeadlineCountdown(futureDate);
  assert.ok(text.includes('d ') && text.includes('h remaining'));
});

test('sanitizeString - strips HTML tags and script elements', () => {
  const malicious = '<script>alert("xss")</script><b>Customer Name</b>';
  const clean = sanitizeString(malicious);
  assert.equal(clean, 'Customer Name');
});

test('sanitizeString - truncates string exceeding max length', () => {
  const longStr = 'a'.repeat(200);
  const truncated = sanitizeString(longStr, 50);
  assert.equal(truncated.length, 50);
});

test('sanitizeString - safely handles non-string inputs', () => {
  assert.equal(sanitizeString(null), '');
  assert.equal(sanitizeString(12345), '');
});

test('formatINR - formats currency in Indian Rupees format', () => {
  assert.equal(formatINR(1245000), '₹12,45,000');
  assert.equal(formatINR(0), '₹0');
  assert.equal(formatINR(NaN), '₹0');
  assert.equal(formatINR('invalid'), '₹0');
});

test('clamp - clamps value between min and max bounds', () => {
  assert.equal(clamp(5, 1, 10), 5);
  assert.equal(clamp(-5, 0, 100), 0);
  assert.equal(clamp(150, 0, 100), 100);
});
