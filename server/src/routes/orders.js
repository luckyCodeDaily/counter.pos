const router = require('express').Router();
const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Counter = require('../models/Counter');
const { authenticate } = require('../middleware/auth');
const validateId = require('../middleware/validateId');
const { ApiError, asyncHandler } = require('../utils/errors');
const { calculateTotals } = require('../utils/billing');
const { STATUSES, canTransition } = require('../utils/transitions');

router.use(authenticate);
router.param('id', validateId);

const taxRate = () => Number(process.env.TAX_RATE ?? 5);
const staffMaxDiscount = () => Number(process.env.STAFF_MAX_DISCOUNT_PERCENT ?? 10);

// Turn client input ({menuItemId, quantity}) into trusted snapshots using DB prices
async function buildItems(raw) {
  if (!Array.isArray(raw) || raw.length === 0) throw new ApiError(400, 'VALIDATION_ERROR', 'At least one item is required');
  const qty = new Map();
  for (const r of raw) {
    const n = Number(r.quantity);
    if (!r.menuItemId || !mongoose.isValidObjectId(r.menuItemId) || !Number.isInteger(n) || n < 1 || n > 99)
      throw new ApiError(400, 'VALIDATION_ERROR', 'Each item needs a valid menuItemId and an integer quantity between 1 and 99');
    qty.set(String(r.menuItemId), (qty.get(String(r.menuItemId)) || 0) + n);
  }
  const ids = [...qty.keys()];
  const found = await MenuItem.find({ _id: { $in: ids } });
  if (found.length !== ids.length) throw new ApiError(404, 'NOT_FOUND', 'One or more menu items do not exist');
  const blocked = found.filter((m) => !m.isActive || !m.isAvailable).map((m) => m.name);
  if (blocked.length) throw new ApiError(422, 'ITEM_UNAVAILABLE', `Unavailable items: ${blocked.join(', ')}`, { items: blocked });
  return found.map((m) => ({ menuItem: m._id, name: m.name, price: m.price, quantity: qty.get(String(m._id)) }));
}

function parseDiscount(d, user, subtotal) {
  if (!d || !Number(d.value)) return { type: 'flat', value: 0 };
  const value = Number(d.value);
  if (!['percent', 'flat'].includes(d.type) || value < 0 || (d.type === 'percent' && value > 100))
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid discount');
  if (user.role !== 'admin') {
    const pct = d.type === 'percent' ? value : (value / subtotal) * 100;
    if (pct > staffMaxDiscount())
      throw new ApiError(403, 'DISCOUNT_LIMIT', `Staff can give at most ${staffMaxDiscount()}% discount. Ask an admin.`);
  }
  return { type: d.type, value };
}

// Server-side pricing used by preview, create and edit
async function price(body, user) {
  const items = await buildItems(body.items);
  const sub = items.reduce((s, i) => s + i.price * i.quantity, 0) || 1;
  const discount = parseDiscount(body.discount, user, sub);
  return { items, discount, totals: calculateTotals(items, { taxRate: taxRate(), discount }) };
}

async function nextOrderNumber() {
  const d = new Date();
  const key = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const c = await Counter.findOneAndUpdate({ _id: `order-${key}` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `ORD-${key}-${String(c.seq).padStart(4, '0')}`;
}

// Totals without saving (lets the UI show server-calculated amounts live)
router.post('/preview', asyncHandler(async (req, res) => {
  const { totals } = await price(req.body || {}, req.user);
  res.json({ totals });
}));

router.post('/', asyncHandler(async (req, res) => {
  const b = req.body || {};
  if (!['Dine-in', 'Takeaway'].includes(b.type)) throw new ApiError(400, 'VALIDATION_ERROR', 'type must be Dine-in or Takeaway');
  const { items, discount, totals } = await price(b, req.user);
  const order = await Order.create({
    orderNumber: await nextOrderNumber(), type: b.type,
    tableNumber: b.type === 'Dine-in' ? b.tableNumber : undefined, customerName: b.customerName,
    items, discount, ...totals, createdBy: req.user.id,
  });
  res.status(201).json({ order });
}));

router.get('/', asyncHandler(async (req, res) => {
  const { status, paymentStatus, search, date } = req.query;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const q = {};
  if (status) { if (!STATUSES.includes(status)) throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid status'); q.status = status; }
  if (paymentStatus) q.paymentStatus = paymentStatus;
  if (search) q.orderNumber = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  if (date) { const s = new Date(`${date}T00:00:00`); q.createdAt = { $gte: s, $lt: new Date(s.getTime() + 864e5) }; }
  const [orders, total] = await Promise.all([
    Order.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(q),
  ]);
  res.json({ orders, page, total, pages: Math.ceil(total / limit) });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('createdBy', 'name').populate('payment.recordedBy', 'name');
  if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  res.json({ order });
}));

// Edit quantities/items/discount; totals are recalculated on the server
router.put('/:id/items', asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  if (order.status !== 'Pending' || order.paymentStatus === 'Paid')
    throw new ApiError(409, 'ORDER_LOCKED', 'Only pending, unpaid orders can be edited');
  const { items, discount, totals } = await price(req.body || {}, req.user);
  Object.assign(order, { items, discount, ...totals });
  await order.save();
  res.json({ order });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) throw new ApiError(400, 'VALIDATION_ERROR', `status must be one of ${STATUSES.join(', ')}`);
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  if (!canTransition(order.status, status))
    throw new ApiError(409, 'INVALID_TRANSITION', `Cannot move order from ${order.status} to ${status}`);
  if (status === 'Completed' && order.paymentStatus !== 'Paid')
    throw new ApiError(409, 'PAYMENT_REQUIRED', 'Record the payment before completing the order');
  order.status = status;
  await order.save();
  res.json({ order });
}));

router.post('/:id/payment', asyncHandler(async (req, res) => {
  const { method, reference } = req.body || {};
  if (!['Cash', 'UPI', 'Card'].includes(method)) throw new ApiError(400, 'VALIDATION_ERROR', 'method must be Cash, UPI or Card');
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'NOT_FOUND', 'Order not found');
  if (order.paymentStatus === 'Paid') throw new ApiError(409, 'ALREADY_PAID', 'This order is already paid');
  // Amount is always the server-calculated total, never client-supplied
  order.payment = { method, reference, amount: order.total, paidAt: new Date(), recordedBy: req.user.id };
  order.paymentStatus = 'Paid';
  await order.save();
  res.json({ order });
}));
module.exports = router;
