import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculatePriorityScore,
  allocateStock,
  allocateStockFIFO,
  compareSmartVsFIFO,
  generateDecisionLog
} from './allocationEngine.js';

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

test('calculatePriorityScore - handles null or invalid order safely', () => {
  assert.equal(calculatePriorityScore(null), 0);
  assert.equal(calculatePriorityScore(undefined), 0);
  assert.equal(calculatePriorityScore({}), 0);
});

test('allocateStock - prioritizes higher score orders over lower score orders', () => {
  const products = [
    { id: 'PROD-1', name: 'Scanner', quantityOnHand: 5, reorderPoint: 2, sku: 'SKU-1' }
  ];

  const orders = [
    {
      id: 'ORD-LOW',
      priority: 'Low',
      createdAt: new Date(Date.now() - 1000).toISOString(),
      deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      status: 'Created',
      items: [{ productId: 'PROD-1', qty: 5 }]
    },
    {
      id: 'ORD-URGENT',
      priority: 'Urgent',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
      status: 'Created',
      items: [{ productId: 'PROD-1', qty: 5 }]
    }
  ];

  const results = allocateStock(orders, products);
  const urgentResult = results.find(r => r.orderId === 'ORD-URGENT');
  const lowResult = results.find(r => r.orderId === 'ORD-LOW');

  assert.equal(urgentResult.status, 'Allocated');
  assert.equal(urgentResult.allocatedQty, 5);
  assert.equal(lowResult.status, 'Waiting');
  assert.equal(lowResult.allocatedQty, 0);
});

test('allocateStock - handles partial allocations correctly', () => {
  const products = [
    { id: 'PROD-1', name: 'Pallet Jack', quantityOnHand: 3, reorderPoint: 1, sku: 'SKU-2' }
  ];

  const orders = [
    {
      id: 'ORD-PARTIAL',
      priority: 'Urgent',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
      status: 'Created',
      items: [{ productId: 'PROD-1', qty: 5 }]
    }
  ];

  const results = allocateStock(orders, products);
  assert.equal(results[0].status, 'Partial');
  assert.equal(results[0].allocatedQty, 3);
});

test('allocateStock - handles zero quantity on hand with Waiting status', () => {
  const products = [
    { id: 'PROD-1', name: 'Tape Dispenser', quantityOnHand: 0, reorderPoint: 1, sku: 'SKU-ZERO' }
  ];

  const orders = [
    {
      id: 'ORD-ZERO',
      priority: 'Urgent',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
      status: 'Created',
      items: [{ productId: 'PROD-1', qty: 2 }]
    }
  ];

  const results = allocateStock(orders, products);
  assert.equal(results[0].status, 'Waiting');
  assert.equal(results[0].allocatedQty, 0);
});

test('allocateStock - safely handles empty or non-array inputs', () => {
  assert.deepEqual(allocateStock([], []), []);
  assert.deepEqual(allocateStock(null, null), []);
});

test('allocateStockFIFO - allocates in creation timestamp order regardless of priority', () => {
  const products = [
    { id: 'PROD-1', name: 'Forklift', quantityOnHand: 2, reorderPoint: 1, sku: 'SKU-3' }
  ];

  const olderLowOrder = {
    id: 'ORD-OLD-LOW',
    priority: 'Low',
    createdAt: new Date(Date.now() - 50000).toISOString(),
    deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    status: 'Created',
    items: [{ productId: 'PROD-1', qty: 2 }]
  };

  const newerUrgentOrder = {
    id: 'ORD-NEW-URGENT',
    priority: 'Urgent',
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    status: 'Created',
    items: [{ productId: 'PROD-1', qty: 2 }]
  };

  const fifoResults = allocateStockFIFO([newerUrgentOrder, olderLowOrder], products);
  const oldResult = fifoResults.find(r => r.orderId === 'ORD-OLD-LOW');
  const newResult = fifoResults.find(r => r.orderId === 'ORD-NEW-URGENT');

  assert.equal(oldResult.status, 'Allocated');
  assert.equal(newResult.status, 'Waiting');
});

test('compareSmartVsFIFO - calculates benchmark comparison metric correctly', () => {
  const products = [
    { id: 'PROD-1', name: 'Item', quantityOnHand: 2, reorderPoint: 1, sku: 'SKU-4' }
  ];

  const olderLowOrder = {
    id: 'ORD-OLD-LOW',
    priority: 'Low',
    createdAt: new Date(Date.now() - 50000).toISOString(),
    deadline: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    status: 'Created',
    items: [{ productId: 'PROD-1', qty: 2 }]
  };

  const newerUrgentOrder = {
    id: 'ORD-NEW-URGENT',
    priority: 'Urgent',
    createdAt: new Date().toISOString(),
    deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
    status: 'Created',
    items: [{ productId: 'PROD-1', qty: 2 }]
  };

  const comparison = compareSmartVsFIFO([olderLowOrder, newerUrgentOrder], products);

  assert.equal(comparison.smartUrgentPct, 100);
  assert.equal(comparison.fifoUrgentPct, 0);
  assert.equal(comparison.diffPct, 100);
  assert.ok(comparison.headline.includes('Smart Allocation fulfills'));
});

test('generateDecisionLog - generates transparent decision logs and stock alert logs', () => {
  const products = [
    { id: 'PROD-1', name: 'Barcode Scanner', quantityOnHand: 1, reorderPoint: 5, sku: 'SKU-1001' }
  ];

  const orders = [
    {
      id: 'ORD-101',
      priority: 'Urgent',
      createdAt: new Date().toISOString(),
      deadline: new Date(Date.now() + 1 * 3600 * 1000).toISOString(),
      status: 'Created',
      items: [{ productId: 'PROD-1', qty: 1 }]
    }
  ];

  const results = allocateStock(orders, products);
  const logs = generateDecisionLog(results, orders, products);

  assert.ok(logs.length >= 2);
  const successLog = logs.find(l => l.type === 'success');
  const alertLog = logs.find(l => l.type === 'alert');

  assert.ok(successLog.text.includes('allocated 1/1 units'));
  assert.ok(alertLog.text.includes('stock below reorder point'));
});
