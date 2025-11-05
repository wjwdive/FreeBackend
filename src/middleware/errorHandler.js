const logger = require('./logger');

/**
 * 全局错误处理中间件
 * 捕获和处理应用程序中的所有错误
 */
const errorHandler = (err, req, res, next) => {
  // 记录错误日志
  logger.LoggerConfig.logError(err, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user.id : 'anonymous'
  });

  // 默认错误响应
  let statusCode = 500;
  let message = '内部服务器错误';
  let errorDetails = null;

  // 根据错误类型设置不同的状态码和消息
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = '请求参数验证失败';
    errorDetails = err.details;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = '认证失败';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = '权限不足';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = '资源不存在';
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
    message = '资源冲突';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    message = '文件大小超过限制';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = '不支持的文件类型';
  } else if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = '数据已存在';
  } else if (err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = '关联数据不存在';
  }

  // 开发环境显示详细错误信息
  const response = {
    statusCode,
    message,
    data: null,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV === 'development' && errorDetails) {
    response.errorDetails = errorDetails;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 异步错误处理包装器
 * 用于包装异步路由处理函数，自动捕获错误
 * @param {Function} fn - 异步函数
 * @returns {Function} 包装后的函数
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * 创建自定义错误
 * @param {string} message - 错误消息
 * @param {number} statusCode - HTTP状态码
 * @param {string} name - 错误名称
 * @returns {Error} 自定义错误对象
 */
const createError = (message, statusCode = 500, name = 'CustomError') => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.name = name;
  return error;
};

/**
 * 404错误处理中间件
 * 当没有匹配的路由时调用
 */
const notFoundHandler = (req, res, next) => {
  const error = createError(`接口不存在: ${req.method} ${req.originalUrl}`, 404, 'NotFoundError');
  next(error);
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
module.exports.createError = createError;
module.exports.notFoundHandler = notFoundHandler;