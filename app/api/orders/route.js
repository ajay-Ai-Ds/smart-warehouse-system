import { allocateStock, calculatePriorityScore, generateDecisionLog } from '@/lib/allocationEngine';
import initialProductsData from '@/data/products.json';
import initialOrdersData from '@/data/orders.json';

// Simple in-memory orders and products store for API demonstrations
let apiOrders = [...initialOrdersData];
let apiProducts = [...initialProductsData];

/**
 * GET /api/orders
 * Returns all current warehouse orders & stock status
 */
export async function GET() {
  return Response.json({
    success: true,
    totalOrders: apiOrders.length,
    orders: apiOrders,
    products: apiProducts
  });
}

/**
 * POST /api/orders
 * Receives new order payload from external e-commerce sites (Shopify, WooCommerce, Custom Store),
 * calculates priority score, runs stock allocation, and returns decision details.
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

    const orderId = body.id || `ORD-${1050 + apiOrders.length}`;
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
      createdAt: new Date().toISOString()
    };

    // Calculate Priority Score
    const priorityScore = calculatePriorityScore(newOrder);

    // Append to orders array
    apiOrders = [newOrder, ...apiOrders];

    // Run stock allocation
    const allocationResults = allocateStock(apiOrders, apiProducts);
    const decisionLogs = generateDecisionLog(allocationResults, apiOrders, apiProducts);

    return Response.json({
      success: true,
      message: `Order #${orderId} received from e-commerce store and processed by Allocation Engine.`,
      order: {
        ...newOrder,
        priorityScore
      },
      allocationResults: allocationResults.filter(r => r.orderId === orderId),
      latestDecisionLog: decisionLogs[0] || null
    });
  } catch (err) {
    return Response.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
