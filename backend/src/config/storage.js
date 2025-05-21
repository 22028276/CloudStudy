const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Mock configuration cho cloud storage
const storageConfig = {
    local: {
        uploadDir: uploadDir
    },
    aws: {
        region: 'mock-region',
        bucket: 'mock-bucket',
        accessKeyId: 'mock-key',
        secretAccessKey: 'mock-secret'
    },
    openstack: {
        authUrl: 'mock-url',
        username: 'mock-user',
        password: 'mock-pass',
        tenantId: 'mock-tenant',
        container: 'mock-container'
    }
};

module.exports = storageConfig; 