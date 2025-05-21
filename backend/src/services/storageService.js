const fs = require('fs');
const path = require('path');
const config = require('../config/storage');

class StorageService {
    constructor() {
        this.uploadDir = config.local.uploadDir;
    }

    // Lưu file vào storage
    async uploadFile(file) {
        try {
            const fileName = `${Date.now()}-${file.originalname}`;
            const filePath = path.join(this.uploadDir, fileName);
            
            // Lưu file vào local storage
            await fs.promises.writeFile(filePath, file.buffer);

            // Trả về thông tin giả lập như từ cloud
            return {
                success: true,
                url: `/uploads/${fileName}`,
                location: filePath,
                key: fileName,
                bucket: 'mock-bucket',
                cloudProvider: 'mock-aws-and-openstack'
            };
        } catch (error) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    // Lấy file từ storage
    async getFile(fileName) {
        try {
            const filePath = path.join(this.uploadDir, fileName);
            const file = await fs.promises.readFile(filePath);
            return file;
        } catch (error) {
            throw new Error(`File not found: ${fileName}`);
        }
    }

    // Xóa file từ storage
    async deleteFile(fileName) {
        try {
            const filePath = path.join(this.uploadDir, fileName);
            await fs.promises.unlink(filePath);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete file: ${fileName}`);
        }
    }

    // Liệt kê tất cả files
    async listFiles() {
        try {
            const files = await fs.promises.readdir(this.uploadDir);
            return files.map(file => ({
                name: file,
                url: `/uploads/${file}`,
                uploadedAt: fs.statSync(path.join(this.uploadDir, file)).mtime
            }));
        } catch (error) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }
}

module.exports = new StorageService(); 