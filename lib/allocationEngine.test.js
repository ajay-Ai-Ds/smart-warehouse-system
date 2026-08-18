import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePriorityScore,
  allocateStock,
  allocateStockFIFO,
  compareSmartVsFIFO,
  generateDecisionLog
} from './allocationEngine.js';

// =========================================================================
// 1. calculatePriorityScore Unit Tests
// =========================================================================

test('calculatePriorityScore - calculates urgent priority with tight deadline correctly', () => {
  const urgentOrder = {
    priority: 'Urgent',
    deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // 1 hour away (+40)
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours old (+20)
  };
  const score = calculatePriorityScore(urgentOrder);
  assert.equal(score, 160); // 100 + 40 + 20
});

test('calculatePriorityScore - calculates standard priority with medium deadline', () => {
  const standardOrder = {
    priority: 'Standard',
    deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours away (+20)
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour old (+10)
  };
  const score = calculatePriorityScore(standardOrder);
  assert.equal(score, 80); // 50 + 20 + 10
});

test('calculatePriorityScore - calculates low priority with distant deadline', () => {
  const lowOrder = {
    priority: 'Low',
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  const score = calculatePriorityScore(lowOrder);
  assert.equal(score, 10); // 10 + 0 + 0
});

test('calculatePriorityScore - caps queue age bonus at maximum 50 points', () => {
  const veryOldOrder = {
    priority: 'Low',
    deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 100 * 3600 * 1000).toISOString() // 100 hours old -> age bonus 50 cap
  };
  const score = calculatePriorityScore(veryOldOrder);
  assert.equal(score, 60); // 10 + 0 + 50 (capped)
});

test('calculatePriorityScore - handles null, undefined, empty, or invalid input safely', () => {
  assert.equal(calculatePriorityScore(null), 0);
  assert.equal(calculatePriorityScore(undefined), 0);
  assert.equal(calculatePriorityScore({}), 0);
  assert.equal(calculatePriorityScore({ priority: 'Unknown' }), 0);
  assert.equal(calculatePriorityScore({ deadline: 'invalid-date' }), 0);
  assert.equal(calculatePriorityScore({ createdAt: 'invalid-date' }), 0);
});

test('calculatePriorityScore - handles overdue / past deadlines gracefully', () => {
  const pastOrder = {
    priority: 'Urgent',
    deadline: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), // overdue
    createdAt: new Date().toISOString()
  };
  const score = calculatePriorityScore(pastOrder);
  // Deadline bonus applies if hoursUntilDeadline <= 2 (negative is <= 2)
  assert.equal(score, 140); // 100 + 40
});

// =========================================================================
// 2. CRITICAL BUSINESS SCENARIO (Exact Hackathon Requirement)
// =========================================================================

test('allocateStock - CRITICAL SCENARIO: Urgent Order A (10 units) vs Lower Priority Order B (5 units) on 7 units stock', () => {
  const products = [
    { id: 'PROD-SHARED', name: 'Industrial Scanner', quantityOnHand: 7, reorderPoint: 2, sku: 'SKU-SCAN' }
  ];

  const orderA = {
    id: 'ORDER-A-URGENT',
    priority: 'Urgent',
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    status: 'Created',
    items: [{ productId: 'PROD-SHARED', qty: 10 }]
  };

  const orderB = {
    id: 'ORDER-B-STANDARD',
    priority: 'Standard',
    createdAt: new Date(Date.now() - 60000).toISOString(), // created slightly earlier
    deadline: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
    status: 'Created',
    items: [{ productId: 'PROD-SHARED', qty: 5 }]
  };

  // Smart Allocation (Order A has higher score ~140 vs Order B ~70)
  const results = allocateStock([orderB, orderA], products);

  const resA = results.find(r => r.orderId === 'ORDER-A-URGENT');
  const resB = results.find(r => r.orderId === 'ORDER-B-STANDARD');

  assert.ok(resA, 'Order A must have an allocation result');
  assert.ok(resB, 'Order B must have an allocation result');

  // Order A gets partial stock (7 of 10 units) because it has higher priority
  assert.equal(resA.allocatedQty, 7);
  assert.equal(resA.requestedQty, 10);
  assert.equal(resA.status, 'Partial');

  // Order B gets 0 units (Waiting / Backordered) because inventory was exhausted by urgent Order A
  assert.equal(resB.allocatedQty, 0);
  assert.equal(resB.requestedQty, 5);
  assert.equal(resB.status, 'Waiting');
});

// =========================================================================
// 3. allocateStock Edge Cases & Boundary Conditions
// =========================================================================

test('allocateStock - exact stock boundary allocation', () => {
  const products = [{ id: 'P-1', quantityOnHand: 10 }];
  const orders = [
    {
      id: 'O-1',
      priority: 'Urgent',
      status: 'Created',
      items: [{ productId: 'P-1', qty: 10 }]
    }
  ];

  const results = allocateStock(orders, products);
  assert.equal(results[0].status, 'Allocated');
  assert.equal(results[0].allocatedQty, 10);
});

test('allocateStock - deterministic tie-breaking for identical priority scores', () => {
  const products = [{ id: 'P-TIED', quantityOnHand: 5 }];
  const olderOrder = {
    id: 'O-OLD',
    priority: 'Standard',
    createdAt: new Date(Date.now() - 50000).toISOString(),
    status: 'Created',
    items: [{ productId: 'P-TIED', qty: 5 }]
  };
  const newerOrder = {
    id: 'O-NEW',
    priority: 'Standard',
    createdAt: new Date(Date.now() - 10000).toISOString(),
    status: 'Created',
    items: [{ productId: 'P-TIED', qty: 5 }]
  };

  const results = allocateStock([newerOrder, olderOrder], products);
  const oldRes = results.find(r => r.orderId === 'O-OLD');
  const newRes = results.find(r => r.orderId === 'O-NEW');

  assert.equal(oldRes.status, 'Allocated');
  assert.equal(newRes.status, 'Waiting');
});

test('allocateStock - multiple orders competing for multiple line items', () => {
  const products = [
    { id: 'P-1', quantityOnHand: 8 },
    { id: 'P-2', quantityOnHand: 4 }
  ];

  const urgentOrder = {
    id: 'O-URGENT',
    priority: 'Urgent',
    status: 'Created',
    items: [
      { productId: 'P-1', qty: 5 },
      { productId: 'P-2', qty: 4 }
    ]
  };

  const standardOrder = {
    id: 'O-STD',
    priority: 'Standard',
    status: 'Created',
    items: [
      { productId: 'P-1', qty: 5 },
      { productId: 'P-2', qty: 2 }
    ]
  };

  const results = allocateStock([standardOrder, urgentOrder], products);
  const urgentP1 = results.find(r => r.orderId === 'O-URGENT' && r.productId === 'P-1');
  const urgentP2 = results.find(r => r.orderId === 'O-URGENT' && r.productId === 'P-2');
  const stdP1 = results.find(r => r.orderId === 'O-STD' && r.productId === 'P-1');
  const stdP2 = results.find(r => r.orderId === 'O-STD' && r.productId === 'P-2');

  assert.equal(urgentP1.status, 'Allocated');
  assert.equal(urgentP1.allocatedQty, 5);
  assert.equal(urgentP2.status, 'Allocated');
  assert.equal(urgentP2.allocatedQty, 4);

  assert.equal(stdP1.status, 'Partial');
  assert.equal(stdP1.allocatedQty, 3);
  assert.equal(stdP2.status, 'Waiting');
  assert.equal(stdP2.allocatedQty, 0);
});

test('allocateStock - ignores already fulfilled or dispatched orders', () => {
  const products = [{ id: 'P-1', quantityOnHand: 5 }];
  const orders = [
    { id: 'O-DISPATCHED', priority: 'Urgent', status: 'Dispatched', items: [{ productId: 'P-1', qty: 5 }] },
    { id: 'O-CREATED', priority: 'Low', status: 'Created', items: [{ productId: 'P-1', qty: 5 }] }
  ];

  const results = allocateStock(orders, products);
  assert.equal(results.length, 1);
  assert.equal(results[0].orderId, 'O-CREATED');
  assert.equal(results[0].status, 'Allocated');
});

test('allocateStock - ignores zero and negative item quantities safely', () => {
  const products = [{ id: 'P-1', quantityOnHand: 5 }];
  const orders = [
    {
      id: 'O-INVALID-QTY',
      priority: 'Urgent',
      status: 'Created',
      items: [
        { productId: 'P-1', qty: 0 },
        { productId: 'P-1', qty: -5 },
        { productId: 'P-1', qty: 3 }
      ]
    }
  ];

  const results = allocateStock(orders, products);
  assert.equal(results.length, 1);
  assert.equal(results[0].allocatedQty, 3);
});

test('allocateStock - safely handles empty arrays and malformed inputs', () => {
  assert.deepEqual(allocateStock([], []), []);
  assert.deepEqual(allocateStock(null, null), []);
  assert.deepEqual(allocateStock([null, {}], [{}]), []);
});

// =========================================================================
// 4. allocateStockFIFO Unit Tests
// =========================================================================

test('allocateStockFIFO - allocates purely in creation order regardless of urgency', () => {
  const products = [{ id: 'P-FIFO', quantityOnHand: 5 }];

  const oldLowOrder = {
    id: 'O-OLD-LOW',
    priority: 'Low',
    createdAt: new Date(Date.now() - 50000).toISOString(),
    status: 'Created',
    items: [{ productId: 'P-FIFO', qty: 5 }]
  };

  const newUrgentOrder = {
    id: 'O-NEW-URGENT',
    priority: 'Urgent',
    createdAt: new Date().toISOString(),
    status: 'Created',
    items: [{ productId: 'P-FIFO', qty: 5 }]
  };

  const fifoResults = allocateStockFIFO([newUrgentOrder, oldLowOrder], products);
  const oldRes = fifoResults.find(r => r.orderId === 'O-OLD-LOW');
  const newRes = fifoResults.find(r => r.orderId === 'O-NEW-URGENT');

  assert.equal(oldRes.status, 'Allocated');
  assert.equal(newRes.status, 'Waiting');
});

test('allocateStockFIFO - handles partial allocations when stock is insufficient', () => {
  const products = [{ id: 'P-FIFO-PARTIAL', quantityOnHand: 3 }];
  const order = {
    id: 'O-FIFO-P',
    priority: 'Low',
    status: 'Created',
    items: [{ productId: 'P-FIFO-PARTIAL', qty: 5 }]
  };
  const results = allocateStockFIFO([order], products);
  assert.equal(results[0].status, 'Partial');
  assert.equal(results[0].allocatedQty, 3);
});

test('allocateStockFIFO - handles null and invalid inputs safely', () => {
  assert.deepEqual(allocateStockFIFO(null, null), []);
  assert.deepEqual(allocateStockFIFO([], []), []);
});

// =========================================================================
// 5. compareSmartVsFIFO Benchmark Unit Tests
// =========================================================================

test('compareSmartVsFIFO - computes SLA performance differential correctly', () => {
  const products = [{ id: 'P-COMP', quantityOnHand: 5 }];

  const oldLowOrder = {
    id: 'O-OLD-LOW',
    priority: 'Low',
    createdAt: new Date(Date.now() - 50000).toISOString(),
    status: 'Created',
    items: [{ productId: 'P-COMP', qty: 5 }]
  };

  const newUrgentOrder = {
    id: 'O-NEW-URGENT',
    priority: 'Urgent',
    createdAt: new Date().toISOString(),
    status: 'Created',
    items: [{ productId: 'P-COMP', qty: 5 }]
  };

  const comparison = compareSmartVsFIFO([oldLowOrder, newUrgentOrder], products);
  assert.equal(comparison.smartUrgentPct, 100);
  assert.equal(comparison.fifoUrgentPct, 0);
  assert.equal(comparison.diffPct, 100);
  assert.equal(comparison.smartStockouts, 1);
  assert.equal(comparison.fifoStockouts, 1);
  assert.ok(comparison.headline.includes('Smart Allocation fulfills 100% more urgent orders'));
});

test('compareSmartVsFIFO - handles empty order list without dividing by zero', () => {
  const comparison = compareSmartVsFIFO([], []);
  assert.equal(comparison.smartUrgentPct, 0);
  assert.equal(comparison.fifoUrgentPct, 0);
  assert.equal(comparison.diffPct, 0);
});

// =========================================================================
// 6. generateDecisionLog Unit Tests
// =========================================================================

test('generateDecisionLog - generates transparent decision and reorder warning logs', () => {
  const products = [
    { id: 'P-1', name: 'Scanner', sku: 'SKU-SCAN', quantityOnHand: 2, reorderPoint: 5 }
  ];

  const orders = [
    { id: 'O-1', priority: 'Urgent', status: 'Created', items: [{ productId: 'P-1', qty: 2 }] },
    { id: 'O-2', priority: 'Standard', status: 'Created', items: [{ productId: 'P-1', qty: 2 }] }
  ];

  const allocationResults = [
    { orderId: 'O-1', productId: 'P-1', requestedQty: 2, allocatedQty: 2, status: 'Allocated' },
    { orderId: 'O-2', productId: 'P-1', requestedQty: 2, allocatedQty: 1, status: 'Partial' },
    { orderId: 'O-3', productId: 'P-1', requestedQty: 2, allocatedQty: 0, status: 'Waiting' }
  ];

  const dummyOrder3 = { id: 'O-3', priority: 'Low', status: 'Created', items: [{ productId: 'P-1', qty: 2 }] };
  const logs = generateDecisionLog(allocationResults, [...orders, dummyOrder3], products);

  assert.ok(logs.length >= 4);

  const allocatedLog = logs.find(l => l.type === 'success');
  const partialLog = logs.find(l => l.type === 'warning');
  const alertLog = logs.find(l => l.type === 'alert' && l.text.includes('insufficient stock'));
  const reorderLog = logs.find(l => l.type === 'alert' && l.text.includes('reorder point'));

  assert.ok(allocatedLog, 'Must generate success log');
  assert.ok(partialLog, 'Must generate partial warning log');
  assert.ok(alertLog, 'Must generate waiting alert log');
  assert.ok(reorderLog, 'Must generate reorder alert log');
});

test('generateDecisionLog - handles null and invalid inputs safely', () => {
  assert.deepEqual(generateDecisionLog(null, null, null), []);
  assert.deepEqual(generateDecisionLog([], [], []), []);
});
