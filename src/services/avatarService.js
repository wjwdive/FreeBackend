const fs = require('fs');
const path = require('path');

class AvatarService {
  constructor() {
    this.avatarsBasePath = path.join(process.cwd(), 'public', 'avatars');
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  }

  /**
   * 获取所有可用的头像列表
   * @returns {Promise<Object>} 头像分类列表
   */
  async getAvailableAvatars() {
    try {
      const categories = ['default', 'male', 'female', 'custom'];
      const avatarList = {};

      for (const category of categories) {
        const categoryPath = path.join(this.avatarsBasePath, category);
        
        if (fs.existsSync(categoryPath)) {
          const files = fs.readdirSync(categoryPath);
          const avatarFiles = files.filter(file => 
            this.supportedFormats.some(format => 
              file.toLowerCase().endsWith(format)
            )
          );

          avatarList[category] = avatarFiles.map(file => ({
            filename: file,
            url: `/avatars/${category}/${file}`,
            category: category
          }));
        } else {
          avatarList[category] = [];
        }
      }

      return {
        statusCode: 200,
        message: '头像列表获取成功',
        data: avatarList,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`获取头像列表失败: ${error.message}`);
    }
  }

  /**
   * 获取随机默认头像
   * @returns {Promise<string>} 随机头像URL
   */
  async getRandomDefaultAvatar() {
    try {
      const defaultPath = path.join(this.avatarsBasePath, 'default');
      
      if (fs.existsSync(defaultPath)) {
        const files = fs.readdirSync(defaultPath);
        const avatarFiles = files.filter(file => 
          this.supportedFormats.some(format => 
            file.toLowerCase().endsWith(format)
          )
        );

        if (avatarFiles.length > 0) {
          const randomFile = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
          return `/avatars/default/${randomFile}`;
        }
      }

      // 如果没有找到默认头像，返回一个占位符URL
      return '/avatars/default/avatar1.jpg';
    } catch (error) {
      console.error('获取随机默认头像失败:', error);
      return '/avatars/default/avatar1.jpg';
    }
  }

  /**
   * 根据性别获取随机头像
   * @param {string} gender - 性别 (male/female)
   * @returns {Promise<string>} 随机头像URL
   */
  async getRandomAvatarByGender(gender = 'male') {
    try {
      const genderPath = path.join(this.avatarsBasePath, gender);
      
      if (fs.existsSync(genderPath)) {
        const files = fs.readdirSync(genderPath);
        const avatarFiles = files.filter(file => 
          this.supportedFormats.some(format => 
            file.toLowerCase().endsWith(format)
          )
        );

        if (avatarFiles.length > 0) {
          const randomFile = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];
          return `/avatars/${gender}/${randomFile}`;
        }
      }

      // 如果没有找到对应性别的头像，返回默认头像
      return await this.getRandomDefaultAvatar();
    } catch (error) {
      console.error(`获取${gender}性别随机头像失败:`, error);
      return await this.getRandomDefaultAvatar();
    }
  }

  /**
   * 检查头像文件是否存在
   * @param {string} avatarUrl - 头像URL路径
   * @returns {boolean} 是否存在
   */
  checkAvatarExists(avatarUrl) {
    try {
      // 从URL中提取文件路径
      const urlParts = avatarUrl.split('/avatars/');
      if (urlParts.length < 2) return false;
      
      const filePath = path.join(this.avatarsBasePath, urlParts[1]);
      return fs.existsSync(filePath);
    } catch (error) {
      console.error('检查头像文件存在性失败:', error);
      return false;
    }
  }

  /**
   * 获取头像文件信息
   * @param {string} avatarUrl - 头像URL路径
   * @returns {Object|null} 文件信息
   */
  getAvatarInfo(avatarUrl) {
    try {
      const urlParts = avatarUrl.split('/avatars/');
      if (urlParts.length < 2) return null;
      
      const filePath = path.join(this.avatarsBasePath, urlParts[1]);
      
      if (!fs.existsSync(filePath)) return null;
      
      const stats = fs.statSync(filePath);
      return {
        filename: path.basename(filePath),
        path: filePath,
        size: stats.size,
        modified: stats.mtime,
        url: avatarUrl
      };
    } catch (error) {
      console.error('获取头像文件信息失败:', error);
      return null;
    }
  }
}

module.exports = new AvatarService();