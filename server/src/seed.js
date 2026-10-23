// Seeds sample menu items only. Users are created via the Register page (first admin) and the Users page.
require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./models/MenuItem');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await MenuItem.deleteMany({});
  await MenuItem.create([
    { name: 'Masala Chai', category: 'Beverages', price: 40 },
    { name: 'Cold Coffee', category: 'Beverages', price: 120 },
    { name: 'Veg Sandwich', category: 'Snacks', price: 90 },
    { name: 'Paneer Wrap', category: 'Snacks', price: 150 },
    { name: 'French Fries', category: 'Snacks', price: 80, isAvailable: false },
    { name: 'Brownie', category: 'Desserts', price: 110 },
  ]);
  console.log('Menu seeded. Open the app and register the first admin.');
  process.exit(0);
})();
