require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentmate';

async function seedEverything() {
  try {
    await mongoose.connect(DB_URI, { dbName: 'rentmate' });
    console.log('✅ Connected to MongoDB');

    // 1. Create/Reset Admin Account
    const adminEmail = 'admin@rentmate.dev';
    const adminPass = 'Admin@1234';
    const adminHash = await bcrypt.hash(adminPass, 10);
    
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: 'RentMate Admin',
          email: adminEmail,
          password: adminHash,
          role: 'admin',
          emailVerified: true,
          managementVerified: true, // admin uses this too just in case
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('\n👑 ADMIN ACCOUNT READY');
    console.log(`Email    : ${adminEmail}`);
    console.log(`Password : ${adminPass}`);

    // 2. Create/Reset Test Student Account
    const studentEmail = 'student@test.com';
    const studentPass = 'Student@123';
    const studentHash = await bcrypt.hash(studentPass, 10);

    await User.findOneAndUpdate(
      { email: studentEmail },
      {
        $set: {
          name: 'Test Student',
          email: studentEmail,
          password: studentHash,
          role: 'student',
          branch: 'CSE',
          department: 'Computer Science',
          phone: '1234567890',
          emailVerified: true,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log('\n🎓 STUDENT ACCOUNT READY');
    console.log(`Email    : ${studentEmail}`);
    console.log(`Password : ${studentPass}`);

    console.log('\n─────────────────────────────────────');
    console.log('✅ You can now login with these accounts!');
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

seedEverything();
