const databaseConfig = require('../config/database');

/**
 * 模型初始化类
 * 负责数据库模型的导入、关联和同步
 */
class ModelInitializer {
  constructor() {
    this.models = {};
    this.initialized = false;
    this.sequelize = databaseConfig.getSequelize();
  }

  /**
   * 初始化所有模型
   */
  async init() {
    if (this.initialized) {
      return;
    }

    try {
      // 导入模型
      const User = require('./User');
      
      // 注册模型
      this.models.User = User;

      // 建立模型关联（如果有）
      this.setupAssociations();

      // 检查数据库是否可用，如果不可用则跳过同步
      if (!this.sequelize) {
        console.log('⚠️  无数据库连接，跳过数据库同步');
        this.initialized = true;
        return;
      }

      // 同步数据库
      await this.syncDatabase();

      this.initialized = true;
      console.log('数据库模型初始化完成');
    } catch (error) {
      console.error('数据库模型初始化失败:', error);
      console.log('⚠️  数据库模型初始化失败，应用将以无数据库模式运行');
      this.initialized = true; // 标记为已初始化，但数据库功能不可用
    }
  }

  /**
   * 设置模型关联关系
   */
  setupAssociations() {
    // 这里可以添加模型之间的关联关系
    // 例如：this.models.User.hasMany(this.models.Post);
    // this.models.Post.belongsTo(this.models.User);
    
    console.log('模型关联关系设置完成');
  }

  /**
   * 同步数据库结构
   * 根据模型定义创建或更新数据库表
   */
  async syncDatabase() {
    try {
      // 检查数据库连接是否可用
      if (!this.sequelize) {
        console.log('⚠️  无数据库连接，跳过数据库同步');
        return;
      }

      // 根据环境决定同步策略
      const syncOptions = {
        force: false, // 生产环境永远不要设置为true
        alter: process.env.NODE_ENV === 'development' // 开发环境允许修改表结构
      };

      await this.sequelize.sync(syncOptions);
      console.log('数据库同步完成');
    } catch (error) {
      console.error('数据库同步失败:', error);
      console.log('⚠️  数据库同步失败，应用将以无数据库模式运行');
      // 不抛出错误，让应用继续运行
    }
  }

  /**
   * 获取所有模型
   * @returns {Object} 模型对象集合
   */
  getModels() {
    return this.models;
  }

  /**
   * 获取特定模型
   * @param {string} modelName - 模型名称
   * @returns {Object|null} 模型实例或null
   */
  getModel(modelName) {
    return this.models[modelName] || null;
  }

  /**
   * 检查是否已初始化
   * @returns {boolean} 初始化状态
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * 关闭数据库连接
   */
  async close() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('数据库连接已关闭');
    }
  }

  /**
   * 健康检查
   * @returns {Promise<Object>} 健康状态信息
   */
  async healthCheck() {
    try {
      await sequelize.authenticate();
      
      // 检查表是否存在
      const tableExists = await sequelize.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'",
        {
          replacements: [sequelize.config.database],
          type: sequelize.QueryTypes.SELECT
        }
      );

      return {
        status: 'healthy',
        database: {
          connected: true,
          tables: {
            users: tableExists.length > 0
          }
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: {
          connected: false,
          error: error.message
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

// 创建单例实例
const modelInitializer = new ModelInitializer();

module.exports = modelInitializer;