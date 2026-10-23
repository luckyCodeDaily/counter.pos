const mongoose = require('mongoose');
const { ApiError } = require('../utils/errors');
module.exports = (req, res, next, id) =>
  mongoose.isValidObjectId(id) ? next() : next(new ApiError(400, 'INVALID_ID', 'Invalid id'));
