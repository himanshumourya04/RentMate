require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rentmate';

async function checkRealUsers() {
  try {
    await mongoose.connect(DB_URI, { dbName: 'rentmate' });
    console.log('✅ Connected to MongoDB Atlas');

    const adminEmail = 'admin8692@test.com';
    const studentEmail = 'himanshumourya313@gmail.com';

    const admin = await User.findOne({ email: adminEmail });
    if (admin) {
      console.log(`\n👑 Found Admin: ${admin.email} (Role: ${admin.role})`);
    } else {
      console.log(`\n❌ Admin NOT FOUND: ${adminEmail}`);
    }

    const student = await User.findOne({ email: studentEmail });
    if (student) {
      console.log(`\n🎓 Found Student: ${student.email} (Role: ${student.role})`);
    } else {
      console.log(`\n❌ Student NOT FOUND: ${studentEmail}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

checkRealUsers();
