const toolsService = require('../services/toolsService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateBody, validateFile } = require('../middleware/validation');

/**
 * 工具控制器类
 * 处理工具类功能的HTTP请求
 */
class ToolsController {
  /**
   * 文件格式转换
   * POST /api/tools/file-convert
   */
  convertFileFormat = asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        statusCode: 400,
        message: '文件不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const { targetFormat } = req.body;
    
    if (!targetFormat) {
      return res.status(400).json({
        statusCode: 400,
        message: '目标格式不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const fileInfo = {
      originalName: req.file.originalname,
      buffer: req.file.buffer
    };

    const result = await toolsService.convertFileFormat(fileInfo, targetFormat);
    
    // 设置响应头，提供下载
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
    res.setHeader('Content-Length', result.size);
    
    res.status(200).send(result.buffer);
  });

  /**
   * 数据加密
   * POST /api/tools/encrypt
   */
  encryptData = asyncHandler(async (req, res) => {
    const { data, algorithm = 'aes-256-cbc', key = null } = req.body;
    
    const result = await toolsService.encryptData(data, algorithm, key);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: {
        encryptedData: result.encryptedData,
        algorithm: result.algorithm,
        iv: result.iv,
        key: result.key
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 数据解密
   * POST /api/tools/decrypt
   */
  decryptData = asyncHandler(async (req, res) => {
    const { encryptedData, algorithm, key, iv } = req.body;
    
    const result = await toolsService.decryptData(encryptedData, algorithm, key, iv);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: {
        decryptedData: result.decryptedData
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 生成验证码
   * GET /api/tools/captcha
   */
  generateCaptcha = asyncHandler(async (req, res) => {
    const { length, includeLetters, includeNumbers } = req.query;
    
    const options = {};
    if (length) options.length = parseInt(length);
    if (includeLetters) options.includeLetters = includeLetters === 'true';
    if (includeNumbers) options.includeNumbers = includeNumbers === 'true';
    
    const result = await toolsService.generateCaptcha(options);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: {
        captchaId: result.captchaId,
        captcha: result.captcha,
        expiresAt: result.expiresAt
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 数据格式转换
   * POST /api/tools/data-convert
   */
  convertDataFormat = asyncHandler(async (req, res) => {
    const { data, fromFormat, toFormat } = req.body;
    
    const result = await toolsService.convertDataFormat(data, fromFormat, toFormat);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: {
        convertedData: result.convertedData,
        fromFormat: result.fromFormat,
        toFormat: result.toFormat
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 服务健康检查
   * GET /api/tools/health
   */
  healthCheck = asyncHandler(async (req, res) => {
    const result = await toolsService.healthCheck();
    
    res.status(200).json({
      statusCode: 200,
      message: '服务健康检查完成',
      data: result,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 获取支持的格式列表
   * GET /api/tools/supported-formats
   */
  getSupportedFormats = asyncHandler(async (req, res) => {
    const supportedFormats = {
      file: {
        image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
        document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
        audio: ['mp3', 'wav', 'ogg', 'flac'],
        video: ['mp4', 'avi', 'mkv', 'mov', 'wmv']
      },
      data: {
        json: ['xml', 'csv', 'yaml'],
        xml: ['json'],
        csv: ['json'],
        yaml: ['json']
      },
      encryption: ['aes-256-cbc', 'aes-192-cbc', 'aes-128-cbc', 'des-ede3-cbc']
    };
    
    res.status(200).json({
      statusCode: 200,
      message: '支持的格式列表获取成功',
      data: supportedFormats,
      timestamp: new Date().toISOString()
    });
  });
}

const toolsController = new ToolsController();

// 导出验证中间件
const validateFileUpload = validateFile({
  maxSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024,
  allowedTypes: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'txt']
});

const validateEncryption = validateBody(require('joi').object({
  data: require('joi').string().required(),
  algorithm: require('joi').string().optional(),
  key: require('joi').string().optional()
}));

const validateDataConvert = validateBody(require('joi').object({
  data: require('joi').string().required(),
  fromFormat: require('joi').string().required(),
  toFormat: require('joi').string().required()
}));

module.exports = {
  convertFileFormat: toolsController.convertFileFormat,
  encryptData: toolsController.encryptData,
  decryptData: toolsController.decryptData,
  generateCaptcha: toolsController.generateCaptcha,
  convertDataFormat: toolsController.convertDataFormat,
  healthCheck: toolsController.healthCheck,
  getSupportedFormats: toolsController.getSupportedFormats,
  validateFileUpload,
  validateEncryption,
  validateDataConvert
};