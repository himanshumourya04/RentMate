/**
 * RentMate - Admin Seed Script
 * Run once to create the admin account in the database.
 *
 * Usage:
 *   cd server
 *   node scripts/seedAdmin.js
 */

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ADMIN_EMAIL = 'admin@rentmate.dev';
const ADMIN_PASSWORD = 'admin@123';
const ADMIN_NAME = 'Developer Admin';

const userSchema = new mongoose.Schema({
  name: String, email: String, password: String,
  role: String, emailVerified: Boolean, managementVerified: Boolean,
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/rentmate');
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log(`Admin already exists: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashed,
    role: 'admin',
    emailVerified: true,
    managementVerified: false,
  });

  console.log('✅ Admin account created successfully!');
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log('   Login at: http://localhost:5173/admin/login');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
