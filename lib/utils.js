/**
 * Smart Warehouse System — Shared Utilities
 *
 * Reusable helper functions used across multiple pages and components.
 * Extracting these avoids code duplication and ensures consistent behavior.
 *
 * @module utils
 */

/**
 * Calculates a human-readable countdown string from now until the given
 * deadline. Returns contextual labels such as "OVERDUE", "23m remaining",
 * "2h 15m remaining", or "1d 4h remaining".
 *
 * @param {string|null|undefined} deadlineString - ISO 8601 date string of the order deadline.
 * @returns {string} Human-readable countdown text.
 *
 * @example
 *   getDeadlineCountdown('2026-08-16T18:00:00Z'); // "2h 15m remaining"
 *   getDeadlineCountdown(null);                    // "No deadline"
 */
export function getDeadlineCountdown(deadlineString) {
  if (!deadlineString) return 'No deadline';

  const now = new Date();
  const deadline = new Date(deadlineString);
  const diffMs = deadline - now;

  if (diffMs <= 0) {
    return 'OVERDUE';
  }

  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h remaining`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }

  return `${minutes}m remaining`;
}

/**
 * Strips HTML tags and script content from a string to prevent
 * injection attacks in user-supplied input.
 *
 * @param {string} input - Raw user input string.
 * @param {number} [maxLength=500] - Maximum allowed character length.
 * @returns {string} Sanitized string safe for display and storage.
 *
 * @example
 *   sanitizeString('<script>alert("xss")</script>Hello'); // "Hello"
 */
export function sanitizeString(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Formats a numeric value as Indian Rupee (₹) currency with the
 * en-IN locale grouping (e.g. 12,45,000).
 *
 * @param {number} value - Numeric amount to format.
 * @returns {string} Formatted currency string with ₹ prefix.
 *
 * @example
 *   formatINR(1245000); // "₹12,45,000"
 */
export function formatINR(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '₹0';
  return `₹${value.toLocaleString('en-IN')}`;
}

/**
 * Clamps a numeric value between a minimum and maximum bound.
 *
 * @param {number} value - The value to clamp.
 * @param {number} min - Minimum allowed value.
 * @param {number} max - Maximum allowed value.
 * @returns {number} The clamped value.
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
