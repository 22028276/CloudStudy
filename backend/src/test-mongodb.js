require('dotenv').config();
const mongoose = require('mongoose');

async function testMongoDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connection successful!');

    // Test creating a user
    const User = require('./models/User');
    const testUser = new User({
      username: 'testuser',
      password: 'testpass123'
    });
    await testUser.save();
    console.log('Test user created successfully!');

    // Clean up
    await User.deleteOne({ username: 'testuser' });
    console.log('Test user deleted successfully!');

  } catch (error) {
    console.error('MongoDB connection test failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit();
  }
}

testMongoDB(); 