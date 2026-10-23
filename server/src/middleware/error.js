const mongoose = require('mongoose');
const notFound = (req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` } });

// Every error leaves the API in the same shape: { error: { code, message, details? } }
function errorHandler(err, req, res, next) {
  let { status = 500, code = 'SERVER_ERROR', message = 'Something went wrong', details } = err;
  if (err instanceof mongoose.Error.ValidationError) { status = 400; code = 'VALIDATION_ERROR'; message = err.message; }
  if (err.code === 11000) { status = 409; code = 'DUPLICATE'; message = 'A record with this value already exists'; }
  if (err.type === 'entity.parse.failed') { status = 400; code = 'BAD_JSON'; message = 'Request body is not valid JSON'; }
  if (status === 500) console.error(err);
  res.status(status).json({ error: { code, message, ...(details && { details }) } });
}
module.exports = { notFound, errorHandler };
