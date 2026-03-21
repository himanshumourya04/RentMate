require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://himanshu7046m_db_user:himanshu7046m_db_user@cluster0.jonvis7.mongodb.net/rentmate?appName=Cluster0"; // grabbed from user's screenshot

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected');
    const result = await User.updateMany(
      { role: 'student', managementVerified: false },
      { $set: { managementVerified: true } }
    );
    console.log(`Successfully verified ${result.modifiedCount} students!`);
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Connection error', err);
    process.exit(1);
  });
