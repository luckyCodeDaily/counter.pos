require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

if (!process.env.JWT_SECRET) { console.error('JWT_SECRET is required'); process.exit(1); }
mongoose.connect(process.env.MONGO_URI).then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`API running on http://localhost:${port}`));
}).catch((e) => { console.error('MongoDB connection failed', e.message); process.exit(1); });
