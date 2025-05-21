const express = require('express');
const router = express.Router();
const multer = require('multer');
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Cấu hình multer để xử lý file upload
const uploadMulter = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // giới hạn 5MB
    }
});

// Document routes - all protected with authentication
router.use(protect);

router.post('/upload', uploadMulter.single('file'), documentController.uploadDocument);
router.get('/', documentController.getDocuments);
router.get('/:id/url', documentController.getDocumentUrl);
router.delete('/:id', documentController.deleteDocument);
router.get('/:id/download', documentController.downloadDocument);
router.get('/:id/preview', documentController.previewDocument);

module.exports = router; 