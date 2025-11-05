const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createError } = require('../middleware/errorHandler');

/**
 * 工具服务类
 * 提供文件处理、数据转换、加解密等工具功能
 */
class ToolsService {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB
  }

  /**
   * 文件格式转换
   * @param {Object} fileInfo - 文件信息
   * @param {string} fileInfo.originalName - 原始文件名
   * @param {string} fileInfo.buffer - 文件缓冲区
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<Object>} 转换结果
   */
  async convertFileFormat(fileInfo, targetFormat) {
    try {
      const { originalName, buffer } = fileInfo;
      
      // 获取文件扩展名
      const originalExt = path.extname(originalName).toLowerCase().slice(1);
      
      // 简单的格式转换逻辑（实际项目中需要根据具体需求实现）
      if (originalExt === targetFormat) {
        throw createError('源文件格式与目标格式相同', 400, 'ValidationError');
      }

      // 这里实现具体的格式转换逻辑
      // 例如：图片格式转换、文档格式转换等
      const convertedBuffer = await this.performFormatConversion(buffer, originalExt, targetFormat);
      
      // 生成新文件名
      const newFileName = `${path.basename(originalName, path.extname(originalName))}.${targetFormat}`;
      
      return {
        fileName: newFileName,
        buffer: convertedBuffer,
        size: convertedBuffer.length,
        format: targetFormat,
        message: '文件格式转换成功'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 执行具体的格式转换（示例实现）
   * @param {Buffer} buffer - 文件缓冲区
   * @param {string} sourceFormat - 源格式
   * @param {string} targetFormat - 目标格式
   * @returns {Promise<Buffer>} 转换后的缓冲区
   */
  async performFormatConversion(buffer, sourceFormat, targetFormat) {
    // 这里应该根据具体的格式转换需求实现
    // 例如使用第三方库进行格式转换
    
    // 示例：简单的文本编码转换
    if (['txt', 'csv', 'json'].includes(sourceFormat) && 
        ['txt', 'csv', 'json'].includes(targetFormat)) {
      return buffer; // 实际项目中需要实现具体的转换逻辑
    }

    throw createError(`不支持从 ${sourceFormat} 到 ${targetFormat} 的转换`, 400, 'ValidationError');
  }

  /**
   * 数据加密
   * @param {string} data - 原始数据
   * @param {string} algorithm - 加密算法
   * @param {string} key - 加密密钥
   * @returns {Promise<Object>} 加密结果
   */
  async encryptData(data, algorithm = 'aes-256-cbc', key = null) {
    try {
      if (!data) {
        throw createError('加密数据不能为空', 400, 'ValidationError');
      }

      // 生成密钥和初始化向量
      const encryptionKey = key || crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      // 创建加密器
      const cipher = crypto.createCipheriv(algorithm, encryptionKey, iv);
      
      // 加密数据
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return {
        encryptedData: encrypted,
        algorithm,
        iv: iv.toString('hex'),
        key: encryptionKey.toString('hex'),
        message: '数据加密成功'
      };
    } catch (error) {
      throw createError(`加密失败: ${error.message}`, 400, 'ValidationError');
    }
  }

  /**
   * 数据解密
   * @param {string} encryptedData - 加密数据
   * @param {string} algorithm - 加密算法
   * @param {string} key - 解密密钥
   * @param {string} iv - 初始化向量
   * @returns {Promise<Object>} 解密结果
   */
  async decryptData(encryptedData, algorithm, key, iv) {
    try {
      if (!encryptedData || !key || !iv) {
        throw createError('解密参数不完整', 400, 'ValidationError');
      }

      // 创建解密器
      const decipher = crypto.createDecipheriv(
        algorithm, 
        Buffer.from(key, 'hex'), 
        Buffer.from(iv, 'hex')
      );
      
      // 解密数据
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return {
        decryptedData: decrypted,
        message: '数据解密成功'
      };
    } catch (error) {
      throw createError(`解密失败: ${error.message}`, 400, 'ValidationError');
    }
  }

  /**
   * 生成验证码
   * @param {Object} options - 验证码选项
   * @param {number} options.length - 验证码长度
   * @param {boolean} options.includeLetters - 是否包含字母
   * @param {boolean} options.includeNumbers - 是否包含数字
   * @returns {Promise<Object>} 验证码信息
   */
  async generateCaptcha(options = {}) {
    try {
      const {
        length = 6,
        includeLetters = true,
        includeNumbers = true
      } = options;

      if (length < 4 || length > 10) {
        throw createError('验证码长度必须在4-10之间', 400, 'ValidationError');
      }

      let characters = '';
      if (includeLetters) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      if (includeNumbers) characters += '0123456789';

      if (!characters) {
        throw createError('至少需要包含字母或数字', 400, 'ValidationError');
      }

      let captcha = '';
      for (let i = 0; i < length; i++) {
        captcha += characters.charAt(Math.floor(Math.random() * characters.length));
      }

      // 生成验证码ID（用于后续验证）
      const captchaId = crypto.randomBytes(16).toString('hex');

      return {
        captchaId,
        captcha,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分钟过期
        message: '验证码生成成功'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 数据格式转换（JSON/XML/CSV等）
   * @param {string} data - 原始数据
   * @param {string} fromFormat - 源格式
   * @param {string} toFormat - 目标格式
   * @returns {Promise<Object>} 转换结果
   */
  async convertDataFormat(data, fromFormat, toFormat) {
    try {
      if (!data) {
        throw createError('转换数据不能为空', 400, 'ValidationError');
      }

      let result;
      
      switch (`${fromFormat.toLowerCase()}_to_${toFormat.toLowerCase()}`) {
        case 'json_to_xml':
          result = this.jsonToXml(data);
          break;
        case 'xml_to_json':
          result = this.xmlToJson(data);
          break;
        case 'json_to_csv':
          result = this.jsonToCsv(data);
          break;
        case 'csv_to_json':
          result = this.csvToJson(data);
          break;
        default:
          throw createError(`不支持从 ${fromFormat} 到 ${toFormat} 的转换`, 400, 'ValidationError');
      }

      return {
        convertedData: result,
        fromFormat,
        toFormat,
        message: '数据格式转换成功'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * JSON转XML（简单实现）
   */
  jsonToXml(jsonData) {
    try {
      const obj = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      return this.objToXml(obj);
    } catch (error) {
      throw createError('JSON数据格式错误', 400, 'ValidationError');
    }
  }

  /**
   * 对象转XML（递归实现）
   */
  objToXml(obj, rootName = 'root') {
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>`;
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        xml += this.objToXml(value, key);
      } else {
        xml += `<${key}>${this.escapeXml(value)}</${key}>`;
      }
    }
    
    xml += `</${rootName}>`;
    return xml;
  }

  /**
   * XML转JSON（简单实现）
   */
  xmlToJson(xmlData) {
    // 简化实现，实际项目中应该使用专门的XML解析库
    throw createError('XML转JSON功能需要专门的解析库支持', 501, 'NotImplementedError');
  }

  /**
   * JSON转CSV（简单实现）
   */
  jsonToCsv(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      const array = Array.isArray(data) ? data : [data];
      
      if (array.length === 0) return '';
      
      const headers = Object.keys(array[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of array) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    } catch (error) {
      throw createError('JSON数据格式错误', 400, 'ValidationError');
    }
  }

  /**
   * CSV转JSON（简单实现）
   */
  csvToJson(csvData) {
    // 简化实现，实际项目中应该使用专门的CSV解析库
    throw createError('CSV转JSON功能需要专门的解析库支持', 501, 'NotImplementedError');
  }

  /**
   * XML转义
   */
  escapeXml(unsafe) {
    return unsafe.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 服务健康检查
   * @returns {Promise<Object>} 健康状态信息
   */
  async healthCheck() {
    try {
      // 检查上传目录
      await fs.access(this.uploadPath);
      
      // 检查磁盘空间（简化实现）
      const diskInfo = await this.getDiskInfo();
      
      return {
        status: 'healthy',
        services: {
          fileSystem: 'available',
          encryption: 'available',
          formatConversion: 'available'
        },
        disk: diskInfo,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {
          fileSystem: 'unavailable',
          encryption: 'available',
          formatConversion: 'available'
        },
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 获取磁盘信息（简化实现）
   */
  async getDiskInfo() {
    try {
      const stats = await fs.stat(this.uploadPath);
      return {
        path: this.uploadPath,
        exists: true,
        writable: true // 简化实现
      };
    } catch (error) {
      return {
        path: this.uploadPath,
        exists: false,
        writable: false,
        error: error.message
      };
    }
  }
}

module.exports = new ToolsService();