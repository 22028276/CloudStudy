const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');

// Cấu hình multer để lưu file trong memory
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // giới hạn 10MB
    }
});

// Routes
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.get('/files', fileController.listFiles);
router.get('/files/:fileName', fileController.downloadFile);
router.delete('/files/:fileName', fileController.deleteFile);

module.exports = router; 