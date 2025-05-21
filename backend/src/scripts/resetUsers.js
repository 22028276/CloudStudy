const mongoose = require('mongoose');
require('dotenv').config();

const resetUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Drop users collection
    await mongoose.connection.collection('users').drop();
    console.log('Users collection dropped');

    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

resetUsers(); 