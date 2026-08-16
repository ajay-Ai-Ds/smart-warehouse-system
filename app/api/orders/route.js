import { Redis } from '@upstash/redis';
import { allocateStock, calculatePriorityScore, generateDecisionLog } from '@/lib/allocationEngine';
import initialProductsData from '@/data/products.json';
import initialOrdersData from '@/data/orders.json';

// Initialize Upstash Redis (reads UPSTASH_REDIS_REST_URL & UPSTASH_REDIS_REST_TOKEN from env)
let redis;
try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
} catch (e) {
  console.warn('Upstash Redis not configured, falling back to in-memory mode.');
  redis = null;
}

// Fallback in-memory store (used when Redis is not configured / local dev)
let inMemoryOrders = [];

const REDIS_KEY = 'live_ecommerce_orders';

/**
 * GET /api/orders
 * Returns all e-commerce orders received from external sites.
 * The Smart Warehouse Dashboard polls this endpoint every 3 seconds.
 */
export async function GET(request) {
  try {
    // Check for ?since= parameter for efficient polling
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since'); // ISO timestamp

    let externalOrders = [];

    if (redis) {
      // Fetch all orders from Upstash Redis list
      const stored = await redis.lrange(REDIS_KEY, 0, 49); // Latest 50 orders
      externalOrders = stored || [];
    } else {
      externalOrders = inMemoryOrders;
    }

    // If 'since' is provided, only return orders newer than that timestamp
    if (since) {
      const sinceDate = new Date(since).getTime();
      externalOrders = externalOrders.filter(
        (order) => new Date(order.createdAt).getTime() > sinceDate
      );
    }

    return Response.json({
      success: true,
      source: 'e-commerce-sync',
      totalOrders: externalOrders.length,
      orders: externalOrders,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/orders
 * Receives new order payload from external e-commerce sites (Quality Enterprises, Shopify, etc.),
 * calculates priority score, runs stock allocation, saves to Upstash Redis,
 * and returns decision details.
 */
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.items || !Array.isArray(body.items)) {
      return Response.json(
        { success: false, error: 'Invalid payload: items array required' },
        { status: 400 }
      );
    }

    // Generate unique order ID with timestamp to avoid collisions
    const timestamp = Date.now();
    const orderId = body.id || `ECOM-${timestamp}`;
    const priority = body.priority || 'Standard';
    const customerName = body.customerName || 'Online E-Commerce Customer';
    const deadlineHours = priority === 'Urgent' ? 2 : priority === 'Standard' ? 6 : 24;
    const deadline = body.deadline || new Date(Date.now() + deadlineHours * 3600 * 1000).toISOString();

    const newOrder = {
      id: orderId,
      customerName,
      items: body.items,
      priority,
      deadline,
      status: 'Created',
      source: 'e-commerce',
      createdAt: new Date().toISOString()
    };

    // Calculate Priority Score
    const priorityScore = calculatePriorityScore(newOrder);
    newOrder.priorityScore = priorityScore;

    // Save to Upstash Redis (persistent shared database)
    if (redis) {
      await redis.lpush(REDIS_KEY, JSON.stringify(newOrder));
      // Keep only the latest 100 orders to avoid exceeding free tier storage
      await redis.ltrim(REDIS_KEY, 0, 99);
    } else {
      // Fallback: save in-memory
      inMemoryOrders = [newOrder, ...inMemoryOrders].slice(0, 100);
    }

    // Run stock allocation for logging purposes
    const allOrders = [newOrder, ...initialOrdersData];
    const allocationResults = allocateStock(allOrders, initialProductsData);
    const decisionLogs = generateDecisionLog(allocationResults, allOrders, initialProductsData);

    return Response.json({
      success: true,
      message: `Order #${orderId} received from e-commerce store, saved to database, and processed by Allocation Engine.`,
      order: {
        ...newOrder,
        priorityScore
      },
      allocationResults: allocationResults.filter(r => r.orderId === orderId),
      latestDecisionLog: decisionLogs[0] || null,
      storage: redis ? 'upstash-redis' : 'in-memory'
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
