require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rentmate').then(async () => {
  const hash = await bcrypt.hash('admin@2026_test', 10);

  let admin = await User.findOne({ email: 'admin8692@test.com' });

  if (admin) {
    admin.password = hash;
    admin.role = 'admin';
    await admin.save();
    const ok = await bcrypt.compare('admin@2026_test', admin.password);
    console.log('✅ Admin password reset. Verify match:', ok);
  } else {
    await User.create({
      name: 'System Admin',
      email: 'admin8692@test.com',
      password: hash,
      role: 'admin',
      phone: '0000000000',
      branch: null,
      verificationStatus: 'verified'
    });
    console.log('✅ Admin account created fresh.');
  }
  mongoose.disconnect();
});
