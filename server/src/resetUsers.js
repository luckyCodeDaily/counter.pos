// Deletes ALL users so the Register (first admin) page opens again.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect(process.env.MONGO_URI)
  .then(() => User.deleteMany({}))
  .then((r) => { console.log(`Deleted ${r.deletedCount} user(s). Register page is open again.`); process.exit(0); })
  .catch((e) => { console.error(e.message); process.exit(1); });
