require('dotenv').config();

module.exports = {
    // MongoDB Configuration
    mongodb: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/cloudstudy'
    },
    
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '24h'
    },
    
    // OpenStack Configuration
    openstack: {
        authUrl: process.env.OPENSTACK_AUTH_URL,
        username: process.env.OPENSTACK_USERNAME,
        password: process.env.OPENSTACK_PASSWORD,
        projectId: process.env.OPENSTACK_PROJECT_ID,
        region: process.env.OPENSTACK_REGION || 'RegionOne',
        container: process.env.OPENSTACK_CONTAINER || 'cloudstudy'
    },
    
    // AWS Configuration
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_BUCKET || 'cloudstudy-bucket'
    },
    
    // Server Configuration
    server: {
        port: process.env.PORT || 5000,
        nodeEnv: process.env.NODE_ENV || 'development'
    }
}; 