const databaseConfig = require('../src/config/database');
const sequelize = databaseConfig.getSequelize();

/**
 * 单独同步数据库表的脚本
 * 避免一次性同步所有模型导致的索引超限问题
 */
async function syncTablesIndividually() {
  if (!sequelize) {
    console.log('❌ 无数据库连接，无法执行同步');
    return;
  }

  try {
    console.log('🔍 检查数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');

    // 导入模型
    const User = require('../src/models/User');
    const News = require('../src/models/News');
    const ApiKey = require('../src/models/ApiKey');

    console.log('\n🔄 开始单独同步数据库表...');

    // 同步选项
    const syncOptions = {
      force: false,
      alter: true, // 允许修改表结构
      logging: console.log
    };

    // 1. 先同步User表
    console.log('\n📊 同步用户表...');
    try {
      await User.sync(syncOptions);
      console.log('✅ 用户表同步完成');
    } catch (error) {
      console.error('❌ 用户表同步失败:', error.message);
    }

    // 2. 同步News表
    console.log('\n📊 同步新闻表...');
    try {
      await News.sync(syncOptions);
      console.log('✅ 新闻表同步完成');
    } catch (error) {
      console.error('❌ 新闻表同步失败:', error.message);
    }

    // 3. 同步ApiKey表
    console.log('\n📊 同步API密钥表...');
    try {
      await ApiKey.sync(syncOptions);
      console.log('✅ API密钥表同步完成');
    } catch (error) {
      console.error('❌ API密钥表同步失败:', error.message);
    }

    console.log('\n🎉 所有表同步完成！');

  } catch (error) {
    console.error('❌ 同步过程出错:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔒 数据库连接已关闭');
    }
  }
}

// 执行同步
syncTablesIndividually();