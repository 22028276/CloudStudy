const multer = require('multer');

// Cấu hình multer để xử lý file upload
const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 500 * 1024 * 1024 // Tăng lên 500MB
    },
    fileFilter: (req, file, cb) => {
        // Danh sách các định dạng file được phép
        const allowedTypes = [
            // Documents
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            // Images
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            // Videos
            'video/mp4',
            'video/x-m4v',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-ms-wmv',
            'video/webm',
            'video/3gpp',
            'video/x-matroska',
            // Text
            'text/plain',
            'text/csv',
            // Archives
            'application/zip',
            'application/x-rar-compressed',
            'application/x-7z-compressed'
        ];

        // Log thông tin file để debug
        console.log('File upload attempt:', {
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size
        });

        // Kiểm tra extension của file
        const ext = file.originalname.split('.').pop().toLowerCase();
        const isMP4 = ext === 'mp4';

        // Nếu là file MP4, chấp nhận bất kể MIME type
        if (isMP4) {
            console.log('Accepting MP4 file:', file.originalname);
            return cb(null, true);
        }

        // Kiểm tra MIME type cho các file khác
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            console.error('File type not allowed:', {
                mimetype: file.mimetype,
                originalname: file.originalname
            });
            cb(new Error(`File type ${file.mimetype} not supported. Allowed types: ${allowedTypes.join(', ')}`), false);
        }
    }
});

// Middleware xử lý lỗi upload
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size exceeds the limit of 500MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    }
    next(err);
};

module.exports = uploadMiddleware; 