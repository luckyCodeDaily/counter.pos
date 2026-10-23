const mongoose = require('mongoose');
const menuSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true }, // temporarily out of stock
  isActive: { type: Boolean, default: true },    // soft delete / deactivated
}, { timestamps: true });
module.exports = mongoose.model('MenuItem', menuSchema);
