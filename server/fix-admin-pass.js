require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');

  const admin = await User.findOne({ email: 'admin@wce.ac.in' });
  console.log('Admin found:', !!admin, '| Role:', admin ? admin.role : 'N/A');

  const hash = await bcrypt.hash('admin@123', 10);

  // Use native driver to bypass Mongoose hooks — avoids double-hash issue
  const updateObj = {};
  updateObj['$set'] = { password: hash, role: 'admin' };

  const result = await User.collection.updateOne({ email: 'admin@wce.ac.in' }, updateObj);
  console.log('Modified:', result.modifiedCount);

  // Verify
  const updated = await User.findOne({ email: 'admin@wce.ac.in' });
  const isValid = await bcrypt.compare('admin@123', updated.password);
  console.log('Password check:', isValid ? 'PASS' : 'FAIL');
  console.log('Role:', updated.role);

  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

