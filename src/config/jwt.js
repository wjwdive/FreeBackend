const jwt = require('jsonwebtoken');

/**
 * JWT配置类
 * 负责JWT令牌的生成、验证和解析
 */
class JWTConfig {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'your_default_secret_key';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  /**
   * 生成JWT令牌
   * @param {Object} payload - 令牌负载数据
   * @param {string} payload.userId - 用户ID
   * @param {string} payload.username - 用户名
   * @param {string} payload.role - 用户角色
   * @returns {string} JWT令牌
   */
  generateToken(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('payload必须是对象');
    }

    if (!payload.userId) {
      throw new Error('payload必须包含userId');
    }

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'freebackend',
      audience: 'freebackend-users'
    });
  }

  /**
   * 验证JWT令牌
   * @param {string} token - JWT令牌
   * @returns {Object} 解码后的令牌数据
   * @throws {Error} 令牌无效时抛出错误
   */
  verifyToken(token) {
    if (!token) {
      throw new Error('令牌不能为空');
    }

    try {
      return jwt.verify(token, this.secret, {
        issuer: 'freebackend',
        audience: 'freebackend-users'
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('令牌已过期');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('无效的令牌');
      } else {
        throw new Error('令牌验证失败');
      }
    }
  }

  /**
   * 解析JWT令牌（不验证签名）
   * @param {string} token - JWT令牌
   * @returns {Object} 解码后的令牌数据
   */
  decodeToken(token) {
    if (!token) {
      throw new Error('令牌不能为空');
    }

    return jwt.decode(token);
  }

  /**
   * 刷新JWT令牌
   * @param {string} token - 旧的JWT令牌
   * @returns {string} 新的JWT令牌
   */
  refreshToken(token) {
    const decoded = this.decodeToken(token);
    
    // 移除过期时间等字段
    const { iat, exp, aud, iss, ...payload } = decoded;
    
    return this.generateToken(payload);
  }

  /**
   * 获取JWT配置信息
   * @returns {Object} JWT配置信息
   */
  getConfig() {
    return {
      secret: this.secret ? '***' : '未设置',
      expiresIn: this.expiresIn
    };
  }
}

module.exports = new JWTConfig();