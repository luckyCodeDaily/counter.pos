const mongoose = require('mongoose');
const { STATUSES } = require('../utils/transitions');

const itemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: String,     // snapshot, so later menu edits do not change old bills
  price: Number,
  quantity: { type: Number, min: 1 },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, index: true },
  type: { type: String, enum: ['Dine-in', 'Takeaway'], required: true },
  tableNumber: String,
  customerName: String,
  items: [itemSchema],
  discount: { type: { type: String, enum: ['percent', 'flat'], default: 'flat' }, value: { type: Number, default: 0 } },
  subtotal: Number, discountAmount: Number, taxRate: Number, taxAmount: Number, total: Number,
  status: { type: String, enum: STATUSES, default: 'Pending', index: true },
  paymentStatus: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid', index: true },
  payment: {
    method: { type: String, enum: ['Cash', 'UPI', 'Card'] },
    amount: Number, reference: String, paidAt: Date,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
module.exports = mongoose.model('Order', orderSchema);
