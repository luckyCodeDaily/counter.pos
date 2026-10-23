const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/errors');

function authenticate(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(new ApiError(401, 'UNAUTHENTICATED', 'Authentication token missing'));
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: p.sub, role: p.role, name: p.name };
    next();
  } catch {
    next(new ApiError(401, 'INVALID_TOKEN', 'Token is invalid or expired'));
  }
}
const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'FORBIDDEN', 'You do not have permission for this action'));

module.exports = { authenticate, requireRole };
