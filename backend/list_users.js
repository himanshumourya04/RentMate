require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // List all students to help identify which to delete
  const users = await User.find({ role: 'student' }).select('email name managementVerified createdAt');
  console.log('All student accounts:');
  users.forEach(u => console.log(`  - ${u.email} | verified: ${u.managementVerified} | created: ${u.createdAt}`));
  mongoose.disconnect();
});
