const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/rentmate').then(async () => { 
  const users = await User.find({ role: 'student' }).select('name collegeIdImage selfieImage profileImage email'); 
  console.log(JSON.stringify(users, null, 2)); 
  process.exit(0); 
}).catch(console.error);
