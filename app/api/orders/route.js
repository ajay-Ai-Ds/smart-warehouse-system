/**
 * API Route — /api/orders
 *
 * Handles GET (polling for new e-commerce orders) and POST (receiving
 * new orders from external e-commerce sites). Persists to Upstash Redis
 * when configured, falls back to in-memory storage for local development.
 * Includes rate limiting, input validation, and sanitization.
 *
 * @module api/orders
 */

import { Redis } from '@upstash/redis';
import { allocateStock, calculatePriorityScore, generateDecisionLog } from '@/lib/allocationEngine';
import { sanitizeString } from '@/lib/utils';
import { checkRateLimit } from '@/lib/rateLimiter';
import { REDIS_KEY, MAX_STORED_ORDERS, MAX_FETCHED_ORDERS, DEFAULT_DEADLINE_HOURS } from '@/lib/constants';
import initialProductsData from '@/data/products.json';
import initialOrdersData from '@/data/orders.json';

/** @type {Redis|null} */
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    redis = null;
  }
}

/** Fallback in-memory store (used when Redis is not configured). */
let inMemoryOrders = [];

/** Maximum allowed items per order to prevent abuse. */
const MAX_ITEMS_PER_ORDER = 50;

/** Maximum allowed quantity per line item. */
const MAX_QTY_PER_ITEM = 10000;

/** Maximum payload size in characters (rough guard). */
const MAX_PAYLOAD_SIZE = 50000;

/**
 * Extracts client IP address from standard proxy headers.
 * @param {Request} request
 * @returns {string} Client IP or fallback identifier.
 */
function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'anonymous-client';
}

/**
 * GET /api/orders
 *
 * Returns e-commerce orders received from external sites. Supports
 * optional `?since=` ISO timestamp parameter for efficient delta polling.
 *
 * @param {Request} request
 * @returns {Response} JSON response with orders array.
 */
export async function GET(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`get_${clientIp}`, 120, 60000);

    if (!rateLimit.success) {
      return Response.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    let externalOrders = [];

    if (redis) {
      const stored = await redis.lrange(REDIS_KEY, 0, MAX_FETCHED_ORDERS - 1);
      externalOrders = (stored || []).map((item) => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        }
        return item;
      }).filter(Boolean);
    } else {
      externalOrders = inMemoryOrders;
    }

    if (since) {
      const sinceDate = new Date(since).getTime();
      if (!Number.isNaN(sinceDate)) {
        externalOrders = externalOrders.filter(
          (order) => new Date(order.createdAt).getTime() > sinceDate
        );
      }
    }

    return Response.json(
      {
        success: true,
        source: 'e-commerce-sync',
        totalOrders: externalOrders.length,
        orders: externalOrders,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 *
 * Receives a new order payload from an external e-commerce site,
 * validates input, calculates priority score, runs allocation,
 * persists to storage, and returns allocation decision details.
 *
 * @param {Request} request
 * @returns {Response} JSON response with order details and allocation results.
 */
export async function POST(request) {
  try {
    const clientIp = getClientIp(request);
    const rateLimit = checkRateLimit(`post_${clientIp}`, 30, 60000);

    if (!rateLimit.success) {
      return Response.json(
        { success: false, error: 'Rate limit exceeded. Too many orders queued in a short window.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.reset),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.reset),
          },
        }
      );
    }

    // Validate Content-Type
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return Response.json(
        { success: false, error: 'Content-Type must be application/json' },
        { status: 415 }
      );
    }

    const rawBody = await request.text();

    // Payload size guard
    if (rawBody.length > MAX_PAYLOAD_SIZE) {
      return Response.json(
        { success: false, error: 'Payload too large' },
        { status: 413 }
      );
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return Response.json(
        { success: false, error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json(
        { success: false, error: 'Order payload must be a JSON object' },
        { status: 400 }
      );
    }

    // Validate items array
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return Response.json(
        { success: false, error: 'Invalid payload: non-empty items array required' },
        { status: 400 }
      );
    }

    if (body.items.length > MAX_ITEMS_PER_ORDER) {
      return Response.json(
        { success: false, error: `Maximum ${MAX_ITEMS_PER_ORDER} items per order allowed` },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item || typeof item !== 'object') {
        return Response.json(
          { success: false, error: 'Each item must be a valid object' },
          { status: 400 }
        );
      }
      if (!item.productId || typeof item.productId !== 'string' || item.productId.trim().length === 0) {
        return Response.json(
          { success: false, error: 'Each item must have a valid non-empty productId string' },
          { status: 400 }
        );
      }
      const qty = Number(item.qty);
      if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0 || qty > MAX_QTY_PER_ITEM) {
        return Response.json(
          { success: false, error: `Item quantity must be a positive integer between 1 and ${MAX_QTY_PER_ITEM}` },
          { status: 400 }
        );
      }
    }

    // Validate priority tier
    const validPriorities = ['Urgent', 'Standard', 'Low'];
    const priority = validPriorities.includes(body.priority) ? body.priority : 'Standard';

    // Sanitize string inputs
    const customerName = sanitizeString(body.customerName || 'Online E-Commerce Customer', 200);
    const orderId = sanitizeString(body.id || `ECOM-${Date.now()}`, 50);

    const deadlineHours = DEFAULT_DEADLINE_HOURS[priority] || 24;
    const deadline =
      body.deadline && !Number.isNaN(new Date(body.deadline).getTime())
        ? new Date(body.deadline).toISOString()
        : new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString();

    const newOrder = {
      id: orderId,
      customerName,
      items: body.items.map((item) => ({
        productId: sanitizeString(item.productId, 50),
        qty: Math.floor(Number(item.qty)),
      })),
      priority,
      deadline,
      status: 'Created',
      source: 'e-commerce',
      createdAt: new Date().toISOString(),
    };

    // Calculate Priority Score
    const priorityScore = calculatePriorityScore(newOrder);
    newOrder.priorityScore = priorityScore;

    // Persist to storage
    if (redis) {
      await redis.lpush(REDIS_KEY, JSON.stringify(newOrder));
      await redis.ltrim(REDIS_KEY, 0, MAX_STORED_ORDERS - 1);
    } else {
      inMemoryOrders = [newOrder, ...inMemoryOrders].slice(0, MAX_STORED_ORDERS);
    }

    // Run stock allocation for logging purposes
    const allOrders = [newOrder, ...initialOrdersData];
    const allocationResults = allocateStock(allOrders, initialProductsData);
    const decisionLogs = generateDecisionLog(allocationResults, allOrders, initialProductsData);

    return Response.json(
      {
        success: true,
        message: `Order #${orderId} received from e-commerce store, saved to database, and processed by Allocation Engine.`,
        order: {
          ...newOrder,
          priorityScore,
        },
        allocationResults: allocationResults.filter((r) => r.orderId === orderId),
        latestDecisionLog: decisionLogs[0] || null,
        storage: redis ? 'upstash-redis' : 'in-memory',
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch {
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
