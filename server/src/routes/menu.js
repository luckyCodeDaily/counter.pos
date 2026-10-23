const router = require('express').Router();
const MenuItem = require('../models/MenuItem');
const { authenticate, requireRole } = require('../middleware/auth');
const validateId = require('../middleware/validateId');
const { ApiError, asyncHandler } = require('../utils/errors');

router.use(authenticate);
router.param('id', validateId);

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function cleanBody(b = {}, partial = false) {
  const out = {};
  if (!partial || b.name !== undefined) { if (!String(b.name || '').trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'name is required'); out.name = String(b.name).trim(); }
  if (!partial || b.category !== undefined) { if (!String(b.category || '').trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'category is required'); out.category = String(b.category).trim(); }
  if (!partial || b.price !== undefined) { const p = Number(b.price); if (!Number.isFinite(p) || p < 0) throw new ApiError(400, 'VALIDATION_ERROR', 'price must be a number >= 0'); out.price = Math.round(p * 100) / 100; }
  for (const k of ['isAvailable', 'isActive']) if (b[k] !== undefined) out[k] = Boolean(b[k]);
  return out;
}

// Everyone sees active items; admins can pass ?includeInactive=true
router.get('/', asyncHandler(async (req, res) => {
  const { search, category, includeInactive, available } = req.query;
  const q = {};
  if (!(includeInactive === 'true' && req.user.role === 'admin')) q.isActive = true;
  if (category) q.category = category;
  if (available === 'true') q.isAvailable = true;
  if (search) q.name = new RegExp(escapeRe(String(search)), 'i');
  const items = await MenuItem.find(q).sort({ category: 1, name: 1 });
  res.json({ items });
}));

router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  res.status(201).json({ item: await MenuItem.create(cleanBody(req.body)) });
}));

router.put('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, cleanBody(req.body, true), { new: true, runValidators: true });
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Menu item not found');
  res.json({ item });
}));

// Soft delete: old orders keep their snapshot
router.delete('/:id', requireRole('admin'), asyncHandler(async (req, res) => {
  const item = await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!item) throw new ApiError(404, 'NOT_FOUND', 'Menu item not found');
  res.json({ item });
}));
module.exports = router;
