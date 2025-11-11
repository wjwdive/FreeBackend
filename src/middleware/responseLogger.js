const { logger } = require('./logger');

/**
 * 响应日志中间件
 * 记录所有接口的详细返回信息，包括接口名、请求时间、返回结果数据
 */
const responseLogger = (req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;
  
  // 重写res.send方法以捕获响应数据
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    try {
      // 解析响应数据
      let responseData = data;
      if (typeof data === 'string') {
        try {
          responseData = JSON.parse(data);
        } catch (e) {
          // 如果不是JSON格式，保持原样
          responseData = data;
        }
      }
      
      // 构建日志信息
      const logInfo = {
        interface: `${req.method} ${req.originalUrl}`,
        requestTime: new Date(startTime).toISOString(),
        responseTime: `${responseTime}ms`,
        statusCode: res.statusCode,
        clientIP: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        userId: req.user ? req.user.userId : 'anonymous',
        userRole: req.user ? req.user.role : 'anonymous'
      };
      
      // 根据响应状态码决定日志级别和内容
      if (res.statusCode >= 400) {
        // 错误响应：记录详细错误信息
        logInfo.errorResponse = {
          message: responseData.message || 'Unknown error',
          errorCode: responseData.errorCode || 'UNKNOWN_ERROR'
        };
        logger.warn('接口响应错误', logInfo);
      } else {
        // 成功响应：记录返回数据摘要
        if (responseData && typeof responseData === 'object') {
          logInfo.responseSummary = {
            dataType: 'object',
            hasData: !!responseData.data,
            message: responseData.message || 'Success'
          };
          
          // 对于分页数据，记录分页信息
          if (responseData.data && responseData.pagination) {
            logInfo.responseSummary.pagination = {
              page: responseData.pagination.page,
              limit: responseData.pagination.limit,
              total: responseData.pagination.total
            };
          }
          
          // 对于列表数据，记录数据条数
          if (responseData.data && Array.isArray(responseData.data)) {
            logInfo.responseSummary.itemCount = responseData.data.length;
          }
        } else {
          logInfo.responseSummary = {
            dataType: typeof responseData,
            content: String(responseData).substring(0, 100) // 截取前100字符
          };
        }
        
        logger.info('接口响应成功', logInfo);
      }
      
      // 开发环境下记录完整响应数据（敏感信息会被过滤）
      if (process.env.NODE_ENV === 'development') {
        const sanitizedData = sanitizeSensitiveData(responseData);
        logger.debug('完整响应数据', {
          interface: logInfo.interface,
          responseData: sanitizedData
        });
      }
      
    } catch (error) {
      logger.error('记录响应日志失败', {
        error: error.message,
        interface: `${req.method} ${req.originalUrl}`,
        requestTime: new Date(startTime).toISOString()
      });
    }
    
    // 调用原始的send方法
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * 过滤敏感数据
 * @param {any} data - 原始数据
 * @returns {any} 过滤后的数据
 */
function sanitizeSensitiveData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'token', 'accessToken', 'refreshToken', 
    'authorization', 'apiKey', 'secret', 'privateKey'
  ];
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeSensitiveData(item));
  }
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field] !== undefined) {
      sanitized[field] = '***FILTERED***';
    }
  }
  
  // 递归处理嵌套对象
  for (const key in sanitized) {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeSensitiveData(sanitized[key]);
    }
  }
  
  return sanitized;
}

/**
 * 接口统计中间件
 * 记录接口调用统计信息
 */
const apiStatistics = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    const interfaceName = `${req.method} ${req.originalUrl}`;
    
    // 记录接口统计信息
    logger.info('接口调用统计', {
      interface: interfaceName,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString(),
      userId: req.user ? req.user.userId : 'anonymous'
    });
    
    // 记录性能指标
    if (responseTime > 1000) {
      logger.warn('接口响应缓慢', {
        interface: interfaceName,
        responseTime: `${responseTime}ms`,
        threshold: '1000ms'
      });
    }
  });
  
  next();
};

module.exports = {
  responseLogger,
  apiStatistics,
  sanitizeSensitiveData
};