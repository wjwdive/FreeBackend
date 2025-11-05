#!/usr/bin/env node

/**
 * 服务器启动文件
 * 应用程序的主入口点
 */

const app = require('./src/app');
const modelInitializer = require('./src/models');
const databaseConfig = require('./src/config/database');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * 优雅关闭处理
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);
  
  try {
    // 关闭数据库连接
    await databaseConfig.close();
    await modelInitializer.close();
    
    console.log('数据库连接已关闭');
    
    // 退出进程
    process.exit(0);
  } catch (error) {
    console.error('优雅关闭失败:', error);
    process.exit(1);
  }
};

/**
 * 启动服务器
 */
const startServer = async () => {
  try {
    console.log('🚀 启动 FreeBackend 服务...');
    console.log(`📝 环境: ${NODE_ENV}`);
    
    // 初始化数据库模型
    console.log('🔧 初始化数据库模型...');
    await modelInitializer.init();
    
    // 测试数据库连接
    console.log('🔌 测试数据库连接...');
    const dbConnected = await databaseConfig.testConnection();
    if (!dbConnected) {
      console.log('⚠️  数据库连接失败，应用将以无数据库模式运行');
      console.log('💡 提示：某些需要数据库的功能将不可用');
    } else {
      console.log('✅ 数据库连接成功');
    }
    
    // 启动HTTP服务器
    const server = app.listen(PORT, () => {
      console.log(`✅ FreeBackend 服务已启动`);
      console.log(`📍 服务地址: http://localhost:${PORT}`);
      console.log(`📊 健康检查: http://localhost:${PORT}/health`);
      console.log(`🔗 API文档: http://localhost:${PORT}/api-docs`);
      console.log('⏰ 启动时间:', new Date().toLocaleString());
    });

    // 优雅关闭处理
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon 重启

    // 未捕获异常处理
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      gracefulShutdown('UNHANDLED_REJECTION');
    });

    // 服务器错误处理
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请使用其他端口`);
      } else {
        console.error('服务器错误:', error);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ 服务器启动失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
};

// 如果是直接运行此文件，则启动服务器
if (require.main === module) {
  startServer();
}

module.exports = app;