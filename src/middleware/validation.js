const Joi = require('joi');

/**
 * 验证中间件类
 * 使用Joi进行请求参数验证
 */
class ValidationMiddleware {
  /**
   * 验证请求体
   * @param {Object} schema - Joi验证模式
   * @returns {Function} 中间件函数
   */
  validateBody(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false, // 返回所有验证错误
        stripUnknown: true // 移除未知字段
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        return res.status(400).json({
          statusCode: 400,
          message: '请求参数验证失败',
          data: { errors: errorDetails },
          timestamp: new Date().toISOString()
        });
      }

      // 验证通过，使用清理后的数据
      req.body = value;
      next();
    };
  }

  /**
   * 验证查询参数
   * @param {Object} schema - Joi验证模式
   * @returns {Function} 中间件函数
   */
  validateQuery(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.query, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        return res.status(400).json({
          statusCode: 400,
          message: '查询参数验证失败',
          data: { errors: errorDetails },
          timestamp: new Date().toISOString()
        });
      }

      req.query = value;
      next();
    };
  }

  /**
   * 验证路由参数
   * @param {Object} schema - Joi验证模式
   * @returns {Function} 中间件函数
   */
  validateParams(schema) {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.params, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errorDetails = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: detail.type
        }));

        return res.status(400).json({
          statusCode: 400,
          message: '路由参数验证失败',
          data: { errors: errorDetails },
          timestamp: new Date().toISOString()
        });
      }

      req.params = value;
      next();
    };
  }

  /**
   * 验证文件上传
   * @param {Object} options - 文件验证选项
   * @param {number} options.maxSize - 最大文件大小（字节）
   * @param {string[]} options.allowedTypes - 允许的文件类型
   * @returns {Function} 中间件函数
   */
  validateFile(options = {}) {
    return (req, res, next) => {
      if (!req.file && !req.files) {
        return res.status(400).json({
          statusCode: 400,
          message: '文件不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const files = req.file ? [req.file] : req.files;
      
      for (const file of files) {
        // 检查文件大小
        if (options.maxSize && file.size > options.maxSize) {
          return res.status(400).json({
            statusCode: 400,
            message: `文件大小不能超过 ${options.maxSize / 1024 / 1024}MB`,
            data: null,
            timestamp: new Date().toISOString()
          });
        }

        // 检查文件类型
        if (options.allowedTypes && options.allowedTypes.length > 0) {
          const fileExtension = file.originalname.split('.').pop().toLowerCase();
          const mimeType = file.mimetype;
          
          if (!options.allowedTypes.includes(fileExtension) && 
              !options.allowedTypes.includes(mimeType)) {
            return res.status(400).json({
              statusCode: 400,
              message: `不支持的文件类型，允许的类型: ${options.allowedTypes.join(', ')}`,
              data: null,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      next();
    };
  }
}

// 常用的验证模式
const commonSchemas = {
  // 用户注册验证
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多30个字符',
        'any.required': '用户名是必填项'
      }),
    password: Joi.string().min(6).max(128).required()
      .messages({
        'string.min': '密码至少6个字符',
        'string.max': '密码最多128个字符',
        'any.required': '密码是必填项'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': '邮箱格式不正确',
        'any.required': '邮箱是必填项'
      })
  }),

  // 用户登录验证
  login: Joi.object({
    username: Joi.string().required()
      .messages({
        'any.required': '用户名是必填项'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': '密码是必填项'
      })
  }),

  // 分页参数验证
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sort: Joi.string().valid('asc', 'desc').default('desc')
  })
};

const validationMiddleware = new ValidationMiddleware();

module.exports = {
  validateBody: validationMiddleware.validateBody.bind(validationMiddleware),
  validateQuery: validationMiddleware.validateQuery.bind(validationMiddleware),
  validateParams: validationMiddleware.validateParams.bind(validationMiddleware),
  validateFile: validationMiddleware.validateFile.bind(validationMiddleware),
  schemas: commonSchemas
};