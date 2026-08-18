import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePriorityScore, allocateStock, generateDecisionLog, compareSmartVsFIFO } from './allocationEngine.js';
import { sanitizeString, getDeadlineCountdown, formatINR } from './utils.js';
import { STAGE_FLOW, PRIORITY_WEIGHTS } from './constants.js';

test('Integration Lifecycle: Ingestion -> Priority Scoring -> Allocation -> Inventory Deduction -> Stage Flow -> Decision Audit', () => {
  // 1. Initial State: Catalog Inventory
  const catalog = [
    { id: 'PROD-101', sku: 'SKU-SCANNER', name: 'Industrial Scanner', quantityOnHand: 15, reorderPoint: 5 },
    { id: 'PROD-102', sku: 'SKU-PRINTER', name: 'RFID Label Printer', quantityOnHand: 8, reorderPoint: 4 }
  ];

  // 2. Ingest New Customer Orders
  const rawOrders = [
    {
      id: '<script>alert("hack")</script>ORD-9001',
      customerName: '<b>Tata Express Logistics</b>',
      priority: 'Urgent',
      deadline: new Date(Date.now() + 1.5 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      status: 'Created',
      items: [
        { productId: 'PROD-101', qty: 10 },
        { productId: 'PROD-102', qty: 5 }
      ]
    },
    {
      id: 'ORD-9002',
      customerName: 'Flipkart Hub Supply',
      priority: 'Standard',
      deadline: new Date(Date.now() + 5 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
      status: 'Created',
      items: [
        { productId: 'PROD-101', qty: 8 },
        { productId: 'PROD-102', qty: 5 }
      ]
    }
  ];

  // 3. Validation & Sanitization Step
  const validatedOrders = rawOrders.map(order => ({
    ...order,
    id: sanitizeString(order.id, 50),
    customerName: sanitizeString(order.customerName, 100),
    priorityScore: calculatePriorityScore(order)
  }));

  assert.equal(validatedOrders[0].id, 'ORD-9001', 'XSS tags stripped from order ID');
  assert.equal(validatedOrders[0].customerName, 'Tata Express Logistics', 'HTML tags stripped from customer name');

  // Verify priority scores: Urgent (100 + 40 deadline + 10 age = 150), Standard (50 + 20 deadline + 20 age = 90)
  assert.equal(validatedOrders[0].priorityScore, 150);
  assert.equal(validatedOrders[1].priorityScore, 90);
  assert.ok(validatedOrders[0].priorityScore > validatedOrders[1].priorityScore);

  // 4. Stock Allocation Execution
  const allocationResults = allocateStock(validatedOrders, catalog);
  assert.equal(allocationResults.length, 4, '4 line items processed');

  // Order 1 (Urgent): Requested PROD-101 (10) -> Allocated 10; PROD-102 (5) -> Allocated 5
  const ord1Item1 = allocationResults.find(r => r.orderId === 'ORD-9001' && r.productId === 'PROD-101');
  const ord1Item2 = allocationResults.find(r => r.orderId === 'ORD-9001' && r.productId === 'PROD-102');
  assert.equal(ord1Item1.status, 'Allocated');
  assert.equal(ord1Item1.allocatedQty, 10);
  assert.equal(ord1Item2.status, 'Allocated');
  assert.equal(ord1Item2.allocatedQty, 5);

  // Order 2 (Standard): Remaining PROD-101 is 5 (requested 8 -> Partial 5); Remaining PROD-102 is 3 (requested 5 -> Partial 3)
  const ord2Item1 = allocationResults.find(r => r.orderId === 'ORD-9002' && r.productId === 'PROD-101');
  const ord2Item2 = allocationResults.find(r => r.orderId === 'ORD-9002' && r.productId === 'PROD-102');
  assert.equal(ord2Item1.status, 'Partial');
  assert.equal(ord2Item1.allocatedQty, 5);
  assert.equal(ord2Item2.status, 'Partial');
  assert.equal(ord2Item2.allocatedQty, 3);

  // 5. Deduct stock from catalog
  const updatedCatalog = catalog.map(product => {
    const totalDeducted = allocationResults
      .filter(r => r.productId === product.id)
      .reduce((sum, r) => sum + r.allocatedQty, 0);
    return {
      ...product,
      quantityOnHand: product.quantityOnHand - totalDeducted
    };
  });

  const p1 = updatedCatalog.find(p => p.id === 'PROD-101');
  const p2 = updatedCatalog.find(p => p.id === 'PROD-102');
  assert.equal(p1.quantityOnHand, 0, 'PROD-101 stock reduced from 15 to 0');
  assert.equal(p2.quantityOnHand, 0, 'PROD-102 stock reduced from 8 to 0');

  // 6. Generate Decision Log Audit Trail
  const decisionLogs = generateDecisionLog(allocationResults, validatedOrders, updatedCatalog);
  assert.ok(decisionLogs.length >= 4);

  // Check reorder warnings triggered for depleted catalog items
  const reorderAlerts = decisionLogs.filter(l => l.type === 'alert' && l.text.includes('reorder point'));
  assert.equal(reorderAlerts.length, 2, 'Both SKUs triggered low-stock alerts');

  // 7. Stage Progression Simulation (Kanban Flow)
  let orderState = validatedOrders[0].status; // 'Created'
  const nextStages = STAGE_FLOW.slice(STAGE_FLOW.indexOf('Created') + 1);

  for (const nextStage of nextStages) {
    orderState = nextStage;
  }
  assert.equal(orderState, 'Dispatched', 'Order transitioned through full Kanban pipeline to Dispatched');
});
