const { Sequelize } = require('sequelize');

/**
 * 数据库配置类
 * 负责数据库连接配置和初始化
 */
class DatabaseConfig {
  constructor() {
    this.sequelize = null;
    this.isConnected = false;
    this.init();
  }

  /**
   * 初始化数据库连接
   */
  init() {
    try {
      // 检查是否配置了数据库连接信息
      const hasDBConfig = process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME;
      
      if (!hasDBConfig) {
        console.log('⚠️  未配置数据库连接信息，应用将以无数据库模式运行');
        this.isConnected = false;
        return;
      }

      // 创建Sequelize实例但不立即连接
      const isProduction = process.env.NODE_ENV === 'production';
      
      this.sequelize = new Sequelize(
        process.env.DB_NAME || 'freebackend',
        process.env.DB_USER || 'root',
        process.env.DB_PASSWORD || '',
        {
          host: process.env.DB_HOST || 'localhost',
          port: process.env.DB_PORT || 3306,
          dialect: 'mysql',
          logging: process.env.DEBUG_DB_QUERIES === 'true' ? console.log : false,
          
          // 生产环境优化连接池配置
          pool: isProduction ? {
            max: 5,           // 生产环境减少最大连接数
            min: 1,           // 保持最小连接数
            acquire: 10000,   // 获取连接超时时间（10秒）
            idle: 60000,     // 空闲连接超时时间（60秒）
            evict: 10000,    // 连接驱逐检查间隔（10秒）
            handleDisconnects: true // 处理断开连接
          } : {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
          },
          
          // 连接重试配置
          retry: {
            max: isProduction ? 2 : 3, // 生产环境减少重试次数
            timeout: 3000,             // 超时时间（3秒）
            match: [
              /SequelizeConnectionError/,
              /SequelizeConnectionRefusedError/,
              /SequelizeHostNotFoundError/,
              /SequelizeHostNotReachableError/,
              /SequelizeInvalidConnectionError/,
              /SequelizeConnectionTimedOutError/
            ]
          },
          
          // 连接参数优化
          dialectOptions: isProduction ? {
            connectTimeout: 10000,     // 连接超时时间（10秒）
            timeout: 30000,            // 查询超时时间（30秒）
            // MySQL 8.0+ 认证插件兼容性
            authPlugins: {
              mysql_native_password: () => require('mysql2/lib/auth/mysql_native_password')
            }
          } : {},
          
          timezone: '+08:00', // 设置时区为东八区
          
          // 查询优化
          benchmark: false,   // 关闭基准测试（生产环境）
          query: {
            raw: true,        // 返回原始结果
            nest: true        // 嵌套结果
          }
        }
      );

      console.log('数据库配置初始化完成');
    } catch (error) {
      console.error('数据库配置初始化失败:', error);
      console.log('⚠️  数据库连接失败，应用将以无数据库模式运行');
      this.isConnected = false;
      this.sequelize = null; // 确保sequelize实例为null
    }
  }

  /**
   * 测试数据库连接
   * @returns {Promise<boolean>} 连接是否成功
   */
  async testConnection() {
    try {
      if (!this.sequelize) {
        console.log('⚠️  无数据库连接，跳过连接测试');
        return false;
      }
      
      await this.sequelize.authenticate();
      this.isConnected = true;
      console.log('数据库连接成功');
      return true;
    } catch (error) {
      console.error('数据库连接失败:', error);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * 获取Sequelize实例
   * @returns {Sequelize} Sequelize实例
   */
  getSequelize() {
    return this.sequelize;
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
}

module.exports = new DatabaseConfig();