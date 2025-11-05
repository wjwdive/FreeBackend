const crypto = require('crypto');

/**
 * 加密工具类
 * 提供各种加密相关的工具函数
 */
class EncryptionUtils {
  /**
   * 生成随机盐值
   * @param {number} length - 盐值长度
   * @returns {string} 随机盐值
   */
  static generateSalt(length = 16) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成随机密钥
   * @param {number} length - 密钥长度
   * @returns {string} 随机密钥
   */
  static generateKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * 生成MD5哈希
   * @param {string} data - 要哈希的数据
   * @returns {string} MD5哈希值
   */
  static md5(data) {
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * 生成SHA256哈希
   * @param {string} data - 要哈希的数据
   * @returns {string} SHA256哈希值
   */
  static sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * 生成HMAC签名
   * @param {string} data - 要签名的数据
   * @param {string} key - 签名密钥
   * @param {string} algorithm - 算法（默认sha256）
   * @returns {string} HMAC签名
   */
  static hmac(data, key, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, key).update(data).digest('hex');
  }

  /**
   * 生成UUID
   * @returns {string} UUID字符串
   */
  static generateUUID() {
    return crypto.randomUUID();
  }

  /**
   * 生成随机数字验证码
   * @param {number} length - 验证码长度
   * @returns {string} 数字验证码
   */
  static generateNumericCode(length = 6) {
    let code = '';
    for (let i = 0; i < length; i++) {
      code += Math.floor(Math.random() * 10);
    }
    return code;
  }

  /**
   * 生成安全的随机字符串
   * @param {number} length - 字符串长度
   * @param {string} charset - 字符集
   * @returns {string} 随机字符串
   */
  static generateRandomString(length = 32, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    let result = '';
    const charsetLength = charset.length;
    
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
    
    return result;
  }

  /**
   * 检查密码强度
   * @param {string} password - 密码
   * @returns {Object} 强度检查结果
   */
  static checkPasswordStrength(password) {
    const checks = {
      length: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    let strength = 'weak';
    
    if (passedChecks >= 4) strength = 'strong';
    else if (passedChecks >= 3) strength = 'medium';

    return {
      strength,
      score: passedChecks,
      maxScore: 5,
      checks
    };
  }

  /**
   * 数据编码（Base64）
   * @param {string} data - 要编码的数据
   * @returns {string} Base64编码结果
   */
  static base64Encode(data) {
    return Buffer.from(data).toString('base64');
  }

  /**
   * 数据解码（Base64）
   * @param {string} data - Base64编码的数据
   * @returns {string} 解码结果
   */
  static base64Decode(data) {
    return Buffer.from(data, 'base64').toString('utf8');
  }

  /**
   * URL安全Base64编码
   * @param {string} data - 要编码的数据
   * @returns {string} URL安全Base64编码结果
   */
  static base64UrlEncode(data) {
    return this.base64Encode(data)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * URL安全Base64解码
   * @param {string} data - URL安全Base64编码的数据
   * @returns {string} 解码结果
   */
  static base64UrlDecode(data) {
    let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    
    // 添加填充
    while (base64.length % 4) {
      base64 += '=';
    }
    
    return this.base64Decode(base64);
  }
}

module.exports = EncryptionUtils;