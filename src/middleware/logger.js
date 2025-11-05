const winston = require('winston');
const path = require('path');

/**
 * 日志配置类
 * 配置Winston日志记录器
 */
class LoggerConfig {
  constructor() {
    this.logger = null;
    this.init();
  }

  /**
   * 初始化日志记录器
   */
  init() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: 'freebackend' },
      transports: [
        // 文件传输 - 错误日志
        new winston.transports.File({
          filename: path.join(process.env.LOG_FILE || './logs', 'error.log'),
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        // 文件传输 - 所有日志
        new winston.transports.File({
          filename: path.join(process.env.LOG_FILE || './logs', 'combined.log'),
          maxsize: 5242880, // 5MB
          maxFiles: 5
        })
      ]
    });

    // 开发环境添加控制台输出
    if (process.env.NODE_ENV !== 'production') {
      this.logger.add(new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }));
    }
  }

  /**
   * 获取日志记录器实例
   * @returns {winston.Logger} 日志记录器
   */
  getLogger() {
    return this.logger;
  }

  /**
   * 记录HTTP请求日志
   * @param {Object} req - Express请求对象
   * @param {Object} res - Express响应对象
   * @param {number} responseTime - 响应时间（毫秒）
   */
  logHttpRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user ? req.user.id : 'anonymous'
    };

    // 根据状态码决定日志级别
    if (res.statusCode >= 400) {
      this.logger.warn('HTTP请求警告', logData);
    } else {
      this.logger.info('HTTP请求', logData);
    }
  }

  /**
   * 记录错误日志
   * @param {Error} error - 错误对象
   * @param {Object} context - 错误上下文信息
   */
  logError(error, context = {}) {
    this.logger.error('系统错误', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * 记录业务日志
   * @param {string} message - 日志消息
   * @param {Object} meta - 元数据
   */
  logBusiness(message, meta = {}) {
    this.logger.info(message, {
      ...meta,
      timestamp: new Date().toISOString()
    });
  }
}

const loggerConfig = new LoggerConfig();

/**
 * HTTP请求日志中间件
 * 记录所有HTTP请求的详细信息
 */
const httpLogger = (req, res, next) => {
  const startTime = Date.now();

  // 响应完成时记录日志
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    loggerConfig.logHttpRequest(req, res, responseTime);
  });

  next();
};

module.exports = httpLogger;
module.exports.logger = loggerConfig.getLogger();
module.exports.LoggerConfig = loggerConfig;