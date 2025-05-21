const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Xử lý lỗi từ Swift service
    if (err.response && err.response.status === 401) {
        return res.status(401).json({
            success: false,
            error: 'Authentication failed. Please try again.'
        });
    }

    if (err.response && err.response.status === 404) {
        return res.status(404).json({
            success: false,
            error: 'Resource not found'
        });
    }

    // Xử lý lỗi từ multer
    if (err.name === 'MulterError') {
        return res.status(400).json({
            success: false,
            error: 'File upload error: ' + err.message
        });
    }

    // Xử lý lỗi mặc định
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
};

module.exports = errorHandler; 