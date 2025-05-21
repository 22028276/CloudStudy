require('dotenv').config();
const mongoose = require('mongoose');
const openstackService = require('./services/openstackService');
const awsService = require('./services/awsService');

async function testConnection() {
    try {
        console.log('Connecting to MongoDB...');
        console.log('Connection string:', process.env.MONGODB_URI);
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected successfully!');
        
        // Test query
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Available collections:', collections.map(c => c.name));
        
    } catch (error) {
        console.error('Connection error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

async function testConnections() {
  try {
    // Test MongoDB connection
    console.log('Testing MongoDB connection...');
    await testConnection();

    // Test OpenStack connection
    console.log('\nTesting OpenStack connection...');
    const testContainer = 'test-container';
    await openstackService.client.createContainer(testContainer);
    console.log('OpenStack connection successful!');
    await openstackService.client.destroyContainer(testContainer);

    // Test AWS connection
    console.log('\nTesting AWS connection...');
    const testText = 'This is a test document for AWS Comprehend.';
    const analysis = await awsService.analyzeText(testText);
    console.log('AWS connection successful!');
    console.log('Sample analysis:', analysis);

  } catch (error) {
    console.error('Connection test failed:', error);
  } finally {
    process.exit();
  }
}

testConnections(); 