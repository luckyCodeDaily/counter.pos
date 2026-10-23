// All maths is done in integer paise to avoid floating point errors.
function calculateTotals(items, { taxRate = 0, discount } = {}) {
  const subP = items.reduce((s, i) => s + Math.round(i.price * 100) * i.quantity, 0);
  let discP = 0;
  if (discount && discount.value > 0) {
    discP = discount.type === 'percent'
      ? Math.round((subP * discount.value) / 100)
      : Math.round(discount.value * 100);
  }
  discP = Math.min(discP, subP); // discount can never exceed subtotal
  const taxableP = subP - discP;
  const taxP = Math.round((taxableP * taxRate) / 100);
  return {
    subtotal: subP / 100,
    discountAmount: discP / 100,
    taxRate,
    taxAmount: taxP / 100,
    total: (taxableP + taxP) / 100,
  };
}
module.exports = { calculateTotals };
