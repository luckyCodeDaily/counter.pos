const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../utils/errors');

const signToken = (u) => jwt.sign({ sub: u.id, role: u.role, name: u.name }, process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

function validateNewUser({ name, email, password }) {
  if (!String(name || '').trim()) throw new ApiError(400, 'VALIDATION_ERROR', 'Name is required');
  if (!/^\S+@\S+\.\S+$/.test(String(email || ''))) throw new ApiError(400, 'VALIDATION_ERROR', 'Enter a valid email');
  if (String(password || '').length < 6) throw new ApiError(400, 'VALIDATION_ERROR', 'Password must be at least 6 characters');
}

// Tells the UI whether first-time setup (admin registration) is still open
router.get('/setup-status', asyncHandler(async (req, res) => {
  res.json({ needsSetup: (await User.countDocuments()) === 0 });
}));

// Public, but only works while there are zero users. First account becomes the admin.
router.post('/register-admin', asyncHandler(async (req, res) => {
  if ((await User.countDocuments()) > 0)
    throw new ApiError(403, 'SETUP_DONE', 'Setup is already complete. Ask the admin to create your account.');
  validateNewUser(req.body || {});
  const { name, email, password } = req.body;
  const user = await User.create({ name: name.trim(), email, role: 'admin', passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) throw new ApiError(400, 'VALIDATION_ERROR', 'Email and password are required');
  const user = await User.findOne({ email: String(email).toLowerCase() });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash)))
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password');
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

// Admin-only: list users and create staff/admin accounts
router.get('/users', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  res.json({ users: await User.find().select('-passwordHash').sort({ createdAt: 1 }) });
}));

router.post('/register', authenticate, requireRole('admin'), asyncHandler(async (req, res) => {
  validateNewUser(req.body || {});
  const { name, email, password, role = 'staff' } = req.body;
  if (!['admin', 'staff'].includes(role)) throw new ApiError(400, 'VALIDATION_ERROR', 'role must be admin or staff');
  const user = await User.create({ name: name.trim(), email, role, passwordHash: await bcrypt.hash(password, 10) });
  res.status(201).json({ user: publicUser(user) });
}));
module.exports = router;
