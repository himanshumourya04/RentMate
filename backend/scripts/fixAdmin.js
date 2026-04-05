/**
 * RentMate - Fix Admin Account
 * Creates or resets the admin account to known credentials.
 * 
 * Usage:
 *   cd backend
 *   node scripts/fixAdmin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const ADMIN_EMAIL    = 'admin@rentmate.dev';
const ADMIN_PASSWORD = 'Admin@1234';
const ADMIN_NAME     = 'RentMate Admin';

async function fix() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB Atlas');

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hash,
        role: 'admin',
        emailVerified: true,
        managementVerified: false,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Verify the hash works
  const ok = await bcrypt.compare(ADMIN_PASSWORD, admin.password);
  console.log('Password verify:', ok ? '✅ PASS' : '❌ FAIL');

  console.log('\n─────────────────────────────────────');
  console.log('  Admin account is ready!');
  console.log(`  Email    : ${ADMIN_EMAIL}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log('  Login at : http://localhost:5173/admin/login');
  console.log('─────────────────────────────────────\n');

  process.exit(0);
}

fix().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
