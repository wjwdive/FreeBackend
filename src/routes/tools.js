const express = require('express');
const multer = require('multer');
const {
  toolsController,
  validateFileUpload,
  validateEncryption,
  validateDataConvert
} = require('../controllers/toolsController');
const { authenticateToken, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// 配置multer用于文件上传
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});

/**
 * @route POST /api/tools/file-convert
 * @description 文件格式转换
 * @access Public (可选认证)
 */
router.post('/file-convert', 
  optionalAuth,
  upload.single('file'),
  validateFileUpload,
  toolsController.convertFileFormat
);

/**
 * @route POST /api/tools/encrypt
 * @description 数据加密
 * @access Public (可选认证)
 */
router.post('/encrypt', 
  optionalAuth,
  validateEncryption,
  toolsController.encryptData
);

/**
 * @route POST /api/tools/decrypt
 * @description 数据解密
 * @access Public (可选认证)
 */
router.post('/decrypt', 
  optionalAuth,
  validateEncryption,
  toolsController.decryptData
);

/**
 * @route GET /api/tools/captcha
 * @description 生成验证码
 * @access Public
 */
router.get('/captcha', toolsController.generateCaptcha);

/**
 * @route POST /api/tools/data-convert
 * @description 数据格式转换
 * @access Public (可选认证)
 */
router.post('/data-convert', 
  optionalAuth,
  validateDataConvert,
  toolsController.convertDataFormat
);

/**
 * @route GET /api/tools/health
 * @description 服务健康检查
 * @access Public
 */
router.get('/health', toolsController.healthCheck);

/**
 * @route GET /api/tools/supported-formats
 * @description 获取支持的格式列表
 * @access Public
 */
router.get('/supported-formats', toolsController.getSupportedFormats);

module.exports = router;