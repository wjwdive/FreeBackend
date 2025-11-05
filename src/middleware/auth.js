const jwtConfig = require('../config/jwt');

/**
 * JWT认证中间件
 * 验证请求头中的Bearer Token
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        message: '访问令牌缺失',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    // 验证令牌
    const decoded = jwtConfig.verifyToken(token);
    
    // 将用户信息添加到请求对象中
    req.user = {
      id: decoded.userId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      statusCode: 401,
      message: error.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * 角色授权中间件
 * @param {string[]} allowedRoles - 允许的角色数组
 * @returns {Function} 中间件函数
 */
const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        statusCode: 401,
        message: '用户未认证',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        statusCode: 403,
        message: '权限不足',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

/**
 * 可选认证中间件
 * 如果提供了令牌则验证，否则继续执行
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwtConfig.verifyToken(token);
      req.user = {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role
      };
    } catch (error) {
      // 令牌无效，但不阻止请求继续
      console.warn('可选认证：令牌无效', error.message);
    }
  }

  next();
};

module.exports = {
  authenticateToken,
  authorize,
  optionalAuth
};