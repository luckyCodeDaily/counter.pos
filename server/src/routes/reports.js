const router = require('express').Router();
const Order = require('../models/Order');
const { authenticate } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/errors');
router.use(authenticate);

// GET /api/reports/daily-sales?date=YYYY-MM-DD (defaults to today, server local time)
router.get('/daily-sales', asyncHandler(async (req, res) => {
  const date = req.query.date || new Date().toLocaleDateString('en-CA');
  const start = new Date(`${date}T00:00:00`);
  if (isNaN(start)) throw new ApiError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
  const range = { $gte: start, $lt: new Date(start.getTime() + 864e5) };

  const [created, sales, recentOrders] = await Promise.all([
    Order.aggregate([{ $match: { createdAt: range } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([{ $match: { paymentStatus: 'Paid', 'payment.paidAt': range } },
      { $group: { _id: '$payment.method', amount: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Order.find({ createdAt: range }).sort({ createdAt: -1 }).limit(8).select('orderNumber type status paymentStatus total createdAt'),
  ]);
  const byStatus = Object.fromEntries(created.map((c) => [c._id, c.count]));
  res.json({
    date,
    totalOrders: created.reduce((s, c) => s + c.count, 0),
    completedOrders: byStatus.Completed || 0,
    byStatus,
    dailySales: Math.round(sales.reduce((s, x) => s + x.amount, 0) * 100) / 100,
    byPaymentMethod: sales.map((s) => ({ method: s._id, amount: s.amount, count: s.count })),
    recentOrders,
  });
}));
module.exports = router;
