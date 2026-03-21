require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  // Delete the stuck test student account
  const result = await User.deleteOne({ email: 'himanshumourya313@gmail.com', role: 'student' });
  console.log('Deleted:', result.deletedCount, 'user(s)');
  mongoose.disconnect();
});
