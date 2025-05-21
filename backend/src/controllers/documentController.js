const path = require('path');
const fs = require('fs');
const openstackService = require('../services/openstackService');
const Document = require('../models/Document');
const axios = require('axios');

// Tạo thư mục uploads nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const documentController = {
    // Upload document
    async uploadDocument(req, res) {
        try {
            if (!req.file) {
                return res.status(400).json({ 
                    success: false,
                    message: 'No file uploaded' 
                });
            }

            // Log thông tin file để debug
            console.log('File info:', {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            });

            // Validate file size
            if (req.file.size > 50 * 1024 * 1024) { // 50MB limit
                return res.status(400).json({
                    success: false,
                    message: 'File size exceeds 50MB limit'
                });
            }

            // Upload to OpenStack
            console.log('Uploading to OpenStack...');
            const openstackResult = await openstackService.uploadFile(req.file, req.user._id);
            console.log('OpenStack upload result:', openstackResult);

            // Save document info to database
            console.log('Saving document to database...');
            const document = await Document.create({
                userId: req.user._id,
                originalName: req.file.originalname,
                fileName: openstackResult.fileName,
                containerName: openstackResult.containerName,
                mimeType: req.file.mimetype,
                size: req.file.size,
                uploadDate: new Date()
            });
            console.log('Document saved successfully');

            res.status(201).json({
                success: true,
                data: document
            });
        } catch (error) {
            console.error('Upload document error details:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            res.status(500).json({ 
                success: false,
                message: error.message || 'Error uploading document'
            });
        }
    },

    // Get all documents
    async getDocuments(req, res) {
        try {
            const documents = await Document.find({ userId: req.user._id })
                .sort({ uploadDate: -1 })
                .select('-__v');
                
            res.json({
                success: true,
                data: documents
            });
        } catch (error) {
            console.error('Get documents error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error fetching documents',
                error: error.message 
            });
        }
    },

    // Delete document
    async deleteDocument(req, res) {
        try {
            const document = await Document.findById(req.params.id);
            if (!document) {
                return res.status(404).json({
                    success: false,
                    message: 'Document not found'
                });
            }

            // Kiểm tra quyền sở hữu
            if (document.userId.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to delete this document'
                });
            }

            // Xóa file khỏi OpenStack
            await openstackService.deleteFile(document.containerName, document.fileName);

            // Xóa document khỏi MongoDB
            await Document.findByIdAndDelete(req.params.id);

            res.json({
                success: true,
                message: 'Document deleted successfully'
            });
        } catch (error) {
            console.error('Delete document error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete document'
            });
        }
    },

    // Get document URL
    async getDocumentUrl(req, res) {
        try {
            const document = await Document.findOne({
                _id: req.params.id,
                userId: req.user._id
            });

            if (!document) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Document not found' 
                });
            }

            // Thay vì trả về URL OpenStack, trả về URL của backend
            const backendUrl = `${req.protocol}://${req.get('host')}`;
            const fileUrl = `${backendUrl}/api/documents/${document._id}/download`;
            const previewUrl = `${backendUrl}/api/documents/${document._id}/preview`;

            res.json({ 
                success: true,
                data: {
                    downloadUrl: fileUrl,
                    previewUrl: previewUrl,
                    mimeType: document.mimeType,
                    fileName: document.originalName
                }
            });
        } catch (error) {
            console.error('Get document URL error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error getting document URL',
                error: error.message 
            });
        }
    },

    // Download document
    async downloadDocument(req, res) {
        try {
            const document = await Document.findOne({
                _id: req.params.id,
                userId: req.user._id
            });

            if (!document) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Document not found' 
                });
            }

            // Lấy file stream từ OpenStack
            const fileStream = await openstackService.getFileStream(document.containerName, document.fileName);

            // Set headers cho response
            res.setHeader('Content-Type', document.mimeType);
            res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
            res.setHeader('Content-Length', document.size);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            // Pipe file stream đến response
            fileStream.pipe(res);
        } catch (error) {
            console.error('Download document error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error downloading document',
                error: error.message 
            });
        }
    },

    // Preview document
    async previewDocument(req, res) {
        try {
            const document = await Document.findOne({
                _id: req.params.id,
                userId: req.user._id
            });

            if (!document) {
                return res.status(404).json({ 
                    success: false,
                    message: 'Document not found' 
                });
            }

            // Kiểm tra loại file có thể preview
            const previewableTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'text/plain',
                'text/csv',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'application/json'
            ];

            if (!previewableTypes.includes(document.mimeType)) {
                return res.status(400).json({
                    success: false,
                    message: 'File type not supported for preview. Please download to view.'
                });
            }

            // Lấy file stream từ OpenStack
            const fileStream = await openstackService.getFileStream(document.containerName, document.fileName);

            // Set headers cho response
            res.setHeader('Content-Type', document.mimeType);
            res.setHeader('Content-Disposition', 'inline');
            res.setHeader('Content-Length', document.size);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            // Pipe file stream đến response
            fileStream.pipe(res);
        } catch (error) {
            console.error('Preview document error:', error);
            res.status(500).json({ 
                success: false,
                message: 'Error previewing document',
                error: error.message 
            });
        }
    }
};

module.exports = documentController; 