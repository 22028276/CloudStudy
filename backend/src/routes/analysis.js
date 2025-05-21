const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');

// Route upload và phân tích
router.post('/', analysisController.upload.single('file'), analysisController.analyze);

module.exports = router; 