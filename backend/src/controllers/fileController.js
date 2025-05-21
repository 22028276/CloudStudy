const swiftService = require('../services/swiftService');
const path = require('path');
const fs = require('fs');

class FileController {
    // Upload file
    async uploadFile(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const result = await swiftService.uploadFile(
                req.file.buffer,
                req.file.originalname,
                req.file.mimetype
            );

            res.json({
                success: true,
                message: 'File uploaded successfully',
                data: result
            });
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Download file
    async downloadFile(req, res) {
        try {
            const { fileName } = req.params;
            const fileData = await swiftService.downloadFile(fileName);
            
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
            res.send(fileData);
        } catch (error) {
            console.error('Download error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // Delete file
    async deleteFile(req, res) {
        try {
            const { fileName } = req.params;
            const result = await swiftService.deleteFile(fileName);
            
            res.json({
                success: true,
                message: 'File deleted successfully',
                data: result
            });
        } catch (error) {
            console.error('Delete error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }

    // List all files
    async listFiles(req, res) {
        try {
            const files = await swiftService.listFiles();
            res.json({
                success: true,
                data: files
            });
        } catch (error) {
            console.error('List files error:', error);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
}

module.exports = new FileController(); 