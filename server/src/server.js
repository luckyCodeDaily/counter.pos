require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is required'); process.exit(1); }
mongoose.connect(process.env.MONGO_URI).then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}).catch((e) => {
  const u = process.env.MONGO_URI || '';
  const m = u.match(/^mongodb(?:\+srv)?:\/\/([^:]+):([^@]*)@([^/]+)\/?([^?]*)/);
  console.error('MongoDB connection failed', e.message);
  console.error('URI check -> starts with:', JSON.stringify(u.slice(0, 14)), '| user:', m?.[1], '| password length:', m?.[2]?.length, '| host:', m?.[3], '| db:', m?.[4]);
  process.exit(1);
});
