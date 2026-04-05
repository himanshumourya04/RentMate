require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentmate';

async function restoreRealLogins() {
  try {
    await mongoose.connect(DB_URI, { dbName: 'rentmate' });
    console.log('✅ Connected to MongoDB Atlas');

    // 1. RESTORE REAL ADMIN
    const adminEmail = 'admin8692@test.com';
    const adminPass = 'admin@2026_test'; // MATCHES THE USER'S SCREENSHOT
    const adminHash = await bcrypt.hash(adminPass, 10);
    
    await User.findOneAndUpdate(
      { email: adminEmail },
      {
        $set: {
          name: 'Real Admin',
          email: adminEmail,
          password: adminHash,
          role: 'admin',
          emailVerified: true,
          managementVerified: true,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`\n👑 RESTORED ADMIN: ${adminEmail} | ${adminPass}`);

    // 2. RESTORE REAL STUDENT
    const studentEmail = 'himanshumourya313@gmail.com';
    const studentPass = 'Himanshu@123'; // Setting a default known password
    const studentHash = await bcrypt.hash(studentPass, 10);

    await User.findOneAndUpdate(
      { email: studentEmail },
      {
        $set: {
          name: 'Himanshu Mourya',
          email: studentEmail,
          password: studentHash,
          role: 'student',
          branch: 'CSE',
          department: 'Computer Science',
          phone: '9999999999',
          emailVerified: true, // SKIPS THE OTP REQUIREMENT
          collegeIdImage: 'uploads/default.jpg',
          selfieImage: 'uploads/default.jpg',
          profileImage: 'uploads/default.jpg',
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    console.log(`🎓 RESTORED STUDENT: ${studentEmail} | ${studentPass}`);

    console.log('\n────────────────────────────────────────────────────────');
    console.log('✅ ALL REAL ACCOUNTS FULLY RESTORED AND SKIPPED OTP!');
    console.log('────────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

restoreRealLogins();
