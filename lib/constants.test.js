import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STAGE_FLOW,
  PRIORITY_WEIGHTS,
  PRIORITY_TIERS,
  DEADLINE_BONUSES,
  MAX_AGE_BONUS,
  SAMPLE_CUSTOMERS,
  KANBAN_COLUMNS,
  STAGE_COLORS,
  PRIORITY_COLORS
} from './constants.js';

test('constants - STAGE_FLOW contains all 6 sequential stages', () => {
  assert.equal(STAGE_FLOW.length, 6);
  assert.deepEqual(STAGE_FLOW, ['Created', 'Allocated', 'Picking', 'Packing', 'QC', 'Dispatched']);
  assert.throws(() => { STAGE_FLOW.push('Invalid'); }, /TypeError/);
});

test('constants - PRIORITY_WEIGHTS matches required tier rankings', () => {
  assert.equal(PRIORITY_WEIGHTS.Urgent, 100);
  assert.equal(PRIORITY_WEIGHTS.Standard, 50);
  assert.equal(PRIORITY_WEIGHTS.Low, 10);
  assert.deepEqual(PRIORITY_TIERS, ['Urgent', 'Standard', 'Low']);
});

test('constants - DEADLINE_BONUSES has valid proximity rules', () => {
  assert.ok(DEADLINE_BONUSES.length >= 2);
  assert.equal(DEADLINE_BONUSES[0].maxHours, 2);
  assert.equal(DEADLINE_BONUSES[0].bonus, 40);
  assert.equal(DEADLINE_BONUSES[1].maxHours, 6);
  assert.equal(DEADLINE_BONUSES[1].bonus, 20);
});

test('constants - MAX_AGE_BONUS is configured to prevent starvation', () => {
  assert.equal(MAX_AGE_BONUS, 50);
});

test('constants - SAMPLE_CUSTOMERS has valid logistics entries', () => {
  assert.ok(SAMPLE_CUSTOMERS.length >= 5);
  assert.ok(SAMPLE_CUSTOMERS.includes('Delhivery Express Logistics'));
});

test('constants - KANBAN_COLUMNS maps to 5 active execution stages', () => {
  assert.equal(KANBAN_COLUMNS.length, 5);
  assert.equal(KANBAN_COLUMNS[0].id, 'Allocated');
  assert.equal(KANBAN_COLUMNS[4].id, 'Dispatched');
});

test('constants - STAGE_COLORS and PRIORITY_COLORS map to all stages and priorities', () => {
  STAGE_FLOW.forEach(stage => {
    assert.ok(STAGE_COLORS[stage], `Missing color for stage ${stage}`);
  });
  PRIORITY_TIERS.forEach(tier => {
    assert.ok(PRIORITY_COLORS[tier], `Missing color for tier ${tier}`);
  });
});
