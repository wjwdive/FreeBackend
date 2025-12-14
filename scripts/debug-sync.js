// 加载环境变量 - 修复路径问题
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// 调试：检查环境变量是否加载成功
console.log('🔍 环境变量调试信息:');
console.log('当前工作目录:', process.cwd());
console.log('DB_HOST:', process.env.DB_HOST || '未设置');
console.log('DB_USER:', process.env.DB_USER || '未设置');
console.log('DB_NAME:', process.env.DB_NAME || '未设置');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '已设置' : '未设置');
console.log('NODE_ENV:', process.env.NODE_ENV || '未设置');

const databaseConfig = require('../src/config/database');
const sequelize = databaseConfig.getSequelize();

/**
 * 调试数据库同步问题的脚本
 */
async function debugSync() {
  if (!sequelize) {
    console.log('❌ 无数据库连接，无法执行同步');
    console.log('检查环境变量配置...');
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_USER:', process.env.DB_USER);
    console.log('DB_NAME:', process.env.DB_NAME);
    return;
  }

  try {
    console.log('🔍 检查数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接正常');

    // 检查现有表
    console.log('\n📊 检查现有表结构...');
    const tables = await sequelize.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = '${sequelize.config.database}'`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log('现有表:', tables.map(t => t.table_name));

    // 检查每个表的索引数量
    console.log('\n🔍 检查各表索引数量...');
    for (const table of tables) {
      const indexes = await sequelize.query(
        `SELECT COUNT(*) as index_count FROM information_schema.statistics WHERE table_schema = '${sequelize.config.database}' AND table_name = '${table.table_name}'`,
        {
          type: sequelize.QueryTypes.SELECT
        }
      );
      console.log(`表 ${table.table_name}: ${indexes[0].index_count} 个索引`);
    }

    // 导入模型
    console.log('\n📦 导入模型...');
    const User = require('../src/models/User');
    const News = require('../src/models/News');
    const ApiKey = require('../src/models/ApiKey');

    console.log('✅ 模型导入完成');

    // 尝试单独同步每个表
    console.log('\n🔄 尝试单独同步每个表...');

    const models = [
      { name: 'User', instance: User },
      { name: 'News', instance: News },
      { name: 'ApiKey', instance: ApiKey }
    ];

    for (const model of models) {
      console.log(`\n📊 同步 ${model.name} 表...`);
      try {
        await model.instance.sync({ 
          force: false, 
          alter: true,
          logging: (sql) => console.log(`SQL: ${sql}`)
        });
        console.log(`✅ ${model.name} 表同步成功`);
      } catch (error) {
        console.error(`❌ ${model.name} 表同步失败:`, error.message);
        console.error('详细错误:', error);
        
        if (error.original && error.original.code === 'ER_TOO_MANY_KEYS') {
          console.error('💡 检测到索引超限错误，尝试清理多余索引...');
          await cleanupIndexes(table.table_name);
        }
      }
    }

    console.log('\n🎉 同步过程完成！');

  } catch (error) {
    console.error('❌ 调试过程出错:', error);
  } finally {
    if (sequelize) {
      await sequelize.close();
      console.log('🔒 数据库连接已关闭');
    }
  }
}

/**
 * 清理多余索引
 */
async function cleanupIndexes(tableName) {
  try {
    console.log(`🧹 清理表 ${tableName} 的多余索引...`);
    
    // 获取当前索引列表
    const indexes = await sequelize.query(
      `SELECT index_name FROM information_schema.statistics WHERE table_schema = '${sequelize.config.database}' AND table_name = '${tableName}' AND index_name != 'PRIMARY'`,
      {
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log(`表 ${tableName} 的非主键索引:`, indexes.map(i => i.index_name));
    
    // 如果索引数量超过限制，删除一些非关键索引
    if (indexes.length > 10) { // 假设保留10个索引
      const indexesToRemove = indexes.slice(10);
      for (const index of indexesToRemove) {
        try {
          await sequelize.query(`DROP INDEX \`${index.index_name}\` ON \`${tableName}\``);
          console.log(`✅ 删除索引: ${index.index_name}`);
        } catch (dropError) {
          console.error(`❌ 删除索引失败: ${index.index_name}`, dropError.message);
        }
      }
    }
  } catch (error) {
    console.error('清理索引失败:', error);
  }
}

// 执行调试
console.log('🚀 开始调试数据库同步问题...');
debugSync();