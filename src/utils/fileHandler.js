const fs = require('fs').promises;
const path = require('path');
const { createError } = require('../middleware/errorHandler');

/**
 * 文件处理工具类
 * 提供文件操作相关的工具函数
 */
class FileHandler {
  constructor() {
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   * @returns {Promise<void>}
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.access(dirPath);
    } catch (error) {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 保存文件
   * @param {Buffer} buffer - 文件缓冲区
   * @param {string} filename - 文件名
   * @param {string} subDir - 子目录
   * @returns {Promise<string>} 文件保存路径
   */
  async saveFile(buffer, filename, subDir = '') {
    try {
      const saveDir = path.join(this.uploadPath, subDir);
      await this.ensureDirectoryExists(saveDir);

      const filePath = path.join(saveDir, filename);
      await fs.writeFile(filePath, buffer);

      return filePath;
    } catch (error) {
      throw createError(`文件保存失败: ${error.message}`, 500, 'FileError');
    }
  }

  /**
   * 读取文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<Buffer>} 文件内容
   */
  async readFile(filePath) {
    try {
      return await fs.readFile(filePath);
    } catch (error) {
      throw createError(`文件读取失败: ${error.message}`, 404, 'FileError');
    }
  }

  /**
   * 删除文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      throw createError(`文件删除失败: ${error.message}`, 500, 'FileError');
    }
  }

  /**
   * 检查文件是否存在
   * @param {string} filePath - 文件路径
   * @returns {Promise<boolean>} 是否存在
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 文件信息
   */
  async getFileInfo(filePath) {
    try {
      const stats = await fs.stat(filePath);
      
      return {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile()
      };
    } catch (error) {
      throw createError(`获取文件信息失败: ${error.message}`, 404, 'FileError');
    }
  }

  /**
   * 生成唯一文件名
   * @param {string} originalName - 原始文件名
   * @returns {string} 唯一文件名
   */
  generateUniqueFilename(originalName) {
    const ext = path.extname(originalName);
    const name = path.basename(originalName, ext);
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    
    return `${name}_${timestamp}_${random}${ext}`;
  }

  /**
   * 获取文件扩展名
   * @param {string} filename - 文件名
   * @returns {string} 文件扩展名
   */
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  /**
   * 验证文件类型
   * @param {string} filename - 文件名
   * @param {string[]} allowedTypes - 允许的文件类型
   * @returns {boolean} 是否允许
   */
  validateFileType(filename, allowedTypes) {
    const ext = this.getFileExtension(filename);
    return allowedTypes.includes(ext);
  }

  /**
   * 验证文件大小
   * @param {number} size - 文件大小
   * @param {number} maxSize - 最大允许大小
   * @returns {boolean} 是否允许
   */
  validateFileSize(size, maxSize) {
    return size <= maxSize;
  }

  /**
   * 清理临时文件
   * @param {string} dirPath - 目录路径
   * @param {number} maxAge - 最大文件年龄（毫秒）
   * @returns {Promise<number>} 删除的文件数量
   */
  async cleanupTempFiles(dirPath, maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    try {
      const files = await fs.readdir(dirPath);
      const now = Date.now();
      let deletedCount = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await this.deleteFile(filePath);
          deletedCount++;
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('清理临时文件失败:', error.message);
      return 0;
    }
  }

  /**
   * 获取目录大小
   * @param {string} dirPath - 目录路径
   * @returns {Promise<number>} 目录大小（字节）
   */
  async getDirectorySize(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = await fs.stat(filePath);
        
        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(filePath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      throw createError(`获取目录大小失败: ${error.message}`, 500, 'FileError');
    }
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = new FileHandler();