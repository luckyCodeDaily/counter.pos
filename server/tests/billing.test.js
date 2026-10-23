const test = require('node:test');
const assert = require('node:assert');
const { calculateTotals } = require('../src/utils/billing');
const { canTransition } = require('../src/utils/transitions');

const items = [{ price: 40, quantity: 2 }, { price: 90, quantity: 1 }]; // subtotal 170

test('subtotal, tax and total', () => {
  const t = calculateTotals(items, { taxRate: 5 });
  assert.deepStrictEqual([t.subtotal, t.taxAmount, t.total], [170, 8.5, 178.5]);
});
test('percent discount applies before tax', () => {
  const t = calculateTotals(items, { taxRate: 5, discount: { type: 'percent', value: 10 } });
  assert.deepStrictEqual([t.discountAmount, t.taxAmount, t.total], [17, 7.65, 160.65]);
});
test('flat discount is capped at subtotal', () => {
  const t = calculateTotals(items, { taxRate: 5, discount: { type: 'flat', value: 999 } });
  assert.strictEqual(t.total, 0);
});
test('totals recalculate when quantity changes', () => {
  assert.strictEqual(calculateTotals([{ price: 40, quantity: 3 }], { taxRate: 0 }).total, 120);
});
test('valid status transitions', () => {
  assert.ok(canTransition('Pending', 'Preparing'));
  assert.ok(canTransition('Ready', 'Completed'));
});
test('invalid status transitions are rejected', () => {
  assert.ok(!canTransition('Pending', 'Completed'));
  assert.ok(!canTransition('Completed', 'Pending'));
  assert.ok(!canTransition('Ready', 'Preparing'));
});
