/**
 * Smart Warehouse System - Allocation Engine
 * 
 * Core decision logic for priority scoring, stock allocation, and log generation.
 */

/**
 * Calculates priority score based on priority tier, deadline, and order age.
 */
export function calculatePriorityScore(order) {
  let score = 0;
  if (order.priority === "Urgent") score += 100;
  if (order.priority === "Standard") score += 50;
  if (order.priority === "Low") score += 10;

  const hoursUntilDeadline = (new Date(order.deadline) - new Date()) / (1000 * 60 * 60);
  if (hoursUntilDeadline <= 2) score += 40;
  else if (hoursUntilDeadline <= 6) score += 20;

  const hoursOld = (new Date() - new Date(order.createdAt)) / (1000 * 60 * 60);
  score += Math.min(Math.max(0, hoursOld * 10), 50); // cap age bonus at 50

  return Math.round(score);
}

/**
 * Allocates stock for orders with status "Created" in priority order.
 * 
 * @param {Array<Object>} orders - List of order objects
 * @param {Array<Object>} products - List of product objects
 * @returns {Array<Object>} Allocation results array [{ orderId, productId, requestedQty, allocatedQty, status }]
 */
export function allocateStock(orders, products) {
  // 1. Filter orders where status === "Created"
  const createdOrders = orders.filter(o => o.status === "Created");

  // 2. Sort by priority score descending
  const sortedOrders = [...createdOrders].sort(
    (a, b) => calculatePriorityScore(b) - calculatePriorityScore(a)
  );

  // 3. Working copy of product stock levels
  const stockMap = new Map(products.map(p => [p.id, p.quantityOnHand]));

  const allocationResults = [];

  // 4. Allocate stock per order and item
  for (const order of sortedOrders) {
    for (const item of order.items) {
      const currentAvailable = stockMap.get(item.productId) || 0;
      let allocatedQty = 0;
      let status = "Waiting";

      if (currentAvailable >= item.qty) {
        allocatedQty = item.qty;
        status = "Allocated";
        stockMap.set(item.productId, currentAvailable - item.qty);
      } else if (currentAvailable > 0) {
        allocatedQty = currentAvailable;
        status = "Partial";
        stockMap.set(item.productId, 0);
      } else {
        allocatedQty = 0;
        status = "Waiting";
      }

      allocationResults.push({
        orderId: order.id,
        productId: item.productId,
        requestedQty: item.qty,
        allocatedQty,
        status
      });
    }
  }

  return allocationResults;
}

/**
 * Generates plain-English decision log entries explaining stock allocation decisions.
 * 
 * @param {Array<Object>} allocationResults - Array of allocation result objects
 * @param {Array<Object>} orders - Full list of orders
 * @param {Array<Object>} products - Full list of products
 * @returns {Array<Object>} Log entry objects with id, timestamp, text, and type
 */
export function generateDecisionLog(allocationResults, orders, products) {
  const orderMap = new Map(orders.map(o => [o.id, o]));
  const productMap = new Map(products.map(p => [p.id, p]));
  const logs = [];

  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  allocationResults.forEach((result, idx) => {
    const order = orderMap.get(result.orderId);
    const product = productMap.get(result.productId);

    if (!order || !product) return;

    const score = calculatePriorityScore(order);
    let logText = "";
    let logType = "info";

    if (result.status === "Allocated") {
      logText = `Order #${order.id} (${order.priority}, Score: ${score}) — allocated ${result.allocatedQty}/${result.requestedQty} units of ${product.name}. Reason: sufficient stock available.`;
      logType = "success";
    } else if (result.status === "Partial") {
      logText = `Order #${order.id} (${order.priority}, Score: ${score}) — allocated ${result.allocatedQty}/${result.requestedQty} units of ${product.name}. Reason: highest priority, partial stock available.`;
      logType = "warning";
    } else {
      logText = `Order #${order.id} (${order.priority}, Score: ${score}) — 0/${result.requestedQty} units allocated for ${product.name}. Reason: insufficient stock after higher-priority orders fulfilled.`;
      logType = "alert";
    }

    logs.push({
      id: `log-${Date.now()}-${idx}`,
      timestamp,
      text: logText,
      type: logType
    });
  });

  // Add low-stock warnings for products below reorder point
  products.forEach((product, idx) => {
    if (product.quantityOnHand <= product.reorderPoint) {
      logs.push({
        id: `alert-${Date.now()}-${idx}`,
        timestamp,
        text: `SKU-${product.sku} (${product.name}) stock below reorder point (${product.quantityOnHand} remaining, reorder point ${product.reorderPoint}) — reorder recommended.`,
        type: "alert"
      });
    }
  });

  return logs;
}
