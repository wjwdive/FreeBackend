const fs = require('fs');
const path = require('path');
const databaseConfig = require('../config/database');

/**
 * 模型初始化器
 * 负责自动导入所有模型文件并设置关联关系
 */
class ModelInitializer {
  constructor() {
    this.models = {};
    this.sequelize = null; // 延迟获取sequelize实例
    this.isInitialized = false;
    this.initializing = false;
  }

  /**
   * 初始化模型
   */
  async init() {
    // 防止重复初始化
    if (this.initializing) {
      console.log('⏳ 模型正在初始化中，请等待...');
      return;
    }
    
    if (this.isInitialized) {
      console.log('✅ 模型已初始化，跳过重复操作');
      return;
    }

    this.initializing = true;
    
    try {
      console.log('🚀 开始初始化数据库模型...');
      
      // 1. 初始化数据库连接
      if (!this.sequelize) {
        console.log('⏳ 初始化数据库连接...');
        await databaseConfig.init();
        this.sequelize = databaseConfig.getSequelize();
      }
      
      // 2. 确保数据库连接已建立
      if (!databaseConfig.isConnected) {
        console.log('⏳ 等待数据库连接...');
        await databaseConfig.testConnection();
      }
      
      // 3. 导入所有模型文件
      await this.importModels();
      
      // 4. 设置模型关联关系
      await this.setupAssociations();
      
      // 5. 同步数据库结构
      await this.syncDatabase();
      
      this.isInitialized = true;
      this.initializing = false;
      console.log('✅ 数据库模型初始化完成');
    } catch (error) {
      console.error('❌ 模型初始化失败:', error);
      this.initializing = false;
      throw error;
    }
  }

  /**
   * 导入所有模型文件
   */
  async importModels() {
    const modelDir = __dirname;
    const files = fs.readdirSync(modelDir);
    
    for (const file of files) {
      // 跳过index.js和非.js文件
      if (file === 'index.js' || !file.endsWith('.js')) {
        continue;
      }
      
      const filePath = path.join(modelDir, file);
      const modelName = path.basename(file, '.js');
      
      try {
        console.log(`📦 导入模型: ${modelName}`);
        
        // 使用新的延迟模型获取方式
        const modelModule = require(filePath);
        
        // 根据不同的导出方式获取模型
        let model;
        if (modelModule.getUserModel) {
          model = modelModule.getUserModel();
        } else if (modelModule.getNewsModel) {
          model = modelModule.getNewsModel();
        } else if (modelModule.getApiKeyModel) {
          model = modelModule.getApiKeyModel();
        } else {
          // 兼容旧的导出方式
          model = modelModule;
        }
        
        this.models[modelName] = model;
        console.log(`✅ 模型 ${modelName} 导入成功`);
      } catch (error) {
        console.error(`❌ 导入模型 ${modelName} 失败:`, error.message);
        throw error;
      }
    }
    
    console.log(`✅ 所有模型导入完成，共导入 ${Object.keys(this.models).length} 个模型`);
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
        alter: process.env.NODE_ENV === 'development', // 开发环境允许修改表结构
        logging: process.env.DEBUG_DB_SYNC === 'true' ? console.log : false // 调试模式
      };

      // 跳过表存在性检查，直接尝试同步
      console.log('🔄 开始数据库同步...');
      
      // 使用更安全的同步方式，避免内部查询错误
      try {
        await this.sequelize.sync(syncOptions);
        console.log('✅ 数据库同步完成');
      } catch (syncError) {
        console.error('❌ 数据库同步失败:', syncError.message);
        
        // 如果同步失败，尝试逐个模型同步，使用更安全的同步选项
        console.log('⚠️  整体同步失败，尝试逐个模型同步...');
        
        const safeSyncOptions = {
          force: false,
          alter: false, // 关闭表结构修改
          logging: false // 关闭日志输出
        };
        
        for (const modelName in this.models) {
          try {
            // 对于User模型，使用更保守的同步策略
            if (modelName === 'User') {
              console.log(`🔄 尝试同步模型 ${modelName}（使用保守策略）...`);
              // 先尝试不创建索引
              await this.models[modelName].sync({ ...safeSyncOptions, indexes: false });
            } else {
              console.log(`🔄 尝试同步模型 ${modelName}...`);
              await this.models[modelName].sync(safeSyncOptions);
            }
            console.log(`✅ 模型 ${modelName} 同步成功`);
          } catch (modelError) {
            console.error(`❌ 模型 ${modelName} 同步失败:`, modelError.message);
            
            // 对于索引过多的错误，提供具体解决方案
            if (modelError.message.includes('Too many keys')) {
              console.error(`💡 解决方案: 请检查 ${modelName} 模型的索引数量，或手动清理数据库中的多余索引`);
            }
            // 继续同步其他模型
          }
        }
        
        console.log('⚠️  数据库同步部分完成，某些表可能未创建');
      }
    } catch (error) {
      if (error.original && error.original.code === 'ER_TOO_MANY_KEYS') {
        console.error('❌ 数据库同步失败: 索引数量超过MySQL限制(64个)');
        console.error('💡 解决方案: 请检查模型定义中的索引数量，或手动清理数据库中的多余索引');
        console.error('📋 临时解决方案: 设置环境变量 SKIP_DB_SYNC=true 跳过数据库同步');
      } else {
        console.error('数据库同步失败:', error);
      }
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
      if (!this.sequelize) {
        return {
          status: 'unhealthy',
          database: {
            connected: false,
            error: '数据库连接未初始化'
          },
          timestamp: new Date().toISOString()
        };
      }
      
      await this.sequelize.authenticate();
      
      // 检查表是否存在
      const tableExists = await this.sequelize.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = ? AND table_name = 'users'",
        {
          replacements: [this.sequelize.config.database],
          type: this.sequelize.QueryTypes.SELECT
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