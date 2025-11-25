#!/usr/bin/env node

/**
 * 数据库索引清理脚本
 * 用于解决 "Too many keys specified; max 64 keys allowed" 错误
 */

const { Sequelize } = require('sequelize');

/**
 * 清理多余索引
 */
async function cleanupIndexes() {
  console.log('🔧 开始清理数据库多余索引...');
  
  try {
    // 创建数据库连接
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'freebackend',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: console.log,
        timezone: '+08:00'
      }
    );

    // 测试连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 获取所有表的索引信息
    const tables = await sequelize.query(
      `SELECT TABLE_NAME 
       FROM information_schema.tables 
       WHERE table_schema = ? 
       AND table_type = 'BASE TABLE'`,
      {
        replacements: [sequelize.config.database],
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log(`📊 发现 ${tables.length} 个表`);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      
      // 获取表的索引信息
      const indexes = await sequelize.query(
        `SELECT INDEX_NAME, COLUMN_NAME, INDEX_TYPE, NON_UNIQUE
         FROM information_schema.statistics 
         WHERE table_schema = ? AND table_name = ?
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`,
        {
          replacements: [sequelize.config.database, tableName],
          type: sequelize.QueryTypes.SELECT
        }
      );

      console.log(`\n📋 表 ${tableName} 的索引信息:`);
      console.log(`索引数量: ${indexes.length}`);
      
      if (indexes.length > 50) {
        console.log(`⚠️  警告: 表 ${tableName} 索引数量(${indexes.length})接近MySQL限制(64)`);
      }

      // 按索引名分组
      const indexGroups = {};
      indexes.forEach(index => {
        if (!indexGroups[index.INDEX_NAME]) {
          indexGroups[index.INDEX_NAME] = [];
        }
        indexGroups[index.INDEX_NAME].push(index);
      });

      // 分析重复或多余的索引
      const duplicateIndexes = [];
      const redundantIndexes = [];

      Object.keys(indexGroups).forEach(indexName => {
        const index = indexGroups[indexName];
        
        // 跳过主键索引
        if (indexName === 'PRIMARY') return;
        
        // 检查是否为重复索引
        const similarIndexes = Object.keys(indexGroups).filter(name => {
          if (name === indexName || name === 'PRIMARY') return false;
          
          const otherIndex = indexGroups[name];
          return index.length === otherIndex.length && 
                 index.every((col, i) => col.COLUMN_NAME === otherIndex[i].COLUMN_NAME);
        });

        if (similarIndexes.length > 0) {
          duplicateIndexes.push({
            table: tableName,
            index: indexName,
            similar: similarIndexes,
            columns: index.map(col => col.COLUMN_NAME).join(', ')
          });
        }

        // 检查是否为前缀索引（可能冗余）
        Object.keys(indexGroups).forEach(otherName => {
          if (otherName === indexName || otherName === 'PRIMARY') return;
          
          const otherIndex = indexGroups[otherName];
          if (index.length < otherIndex.length) {
            const isPrefix = otherIndex.slice(0, index.length).every((col, i) => 
              col.COLUMN_NAME === index[i].COLUMN_NAME
            );
            
            if (isPrefix) {
              redundantIndexes.push({
                table: tableName,
                shortIndex: indexName,
                longIndex: otherName,
                shortColumns: index.map(col => col.COLUMN_NAME).join(', '),
                longColumns: otherIndex.map(col => col.COLUMN_NAME).join(', ')
              });
            }
          }
        });
      });

      // 输出分析结果
      if (duplicateIndexes.length > 0) {
        console.log('🔍 发现重复索引:');
        duplicateIndexes.forEach(dup => {
          console.log(`   - ${dup.index} (${dup.columns})`);
          console.log(`     重复索引: ${dup.similar.join(', ')}`);
        });
      }

      if (redundantIndexes.length > 0) {
        console.log('🔍 发现可能冗余的索引:');
        redundantIndexes.forEach(red => {
          console.log(`   - ${red.shortIndex} (${red.shortColumns})`);
          console.log(`     可能被 ${red.longIndex} (${red.longColumns}) 覆盖`);
        });
      }

      // 如果索引数量过多，提供清理建议
      if (indexes.length > 60) {
        console.log('🚨 警告: 索引数量接近或超过MySQL限制，建议清理');
        
        // 提供清理命令（需要手动确认后执行）
        console.log('💡 清理建议:');
        console.log(`   ALTER TABLE ${tableName} DROP INDEX 索引名;`);
        console.log('💡 或者使用以下命令查看详细索引信息:');
        console.log(`   SHOW INDEX FROM ${tableName};`);
      }
    }

    console.log('\n✅ 索引分析完成');
    console.log('💡 提示: 请根据分析结果手动清理多余索引');
    console.log('💡 临时解决方案: 设置环境变量 SKIP_DB_SYNC=true 跳过数据库同步');

    await sequelize.close();
    
  } catch (error) {
    console.error('❌ 索引清理失败:', error.message);
    
    if (error.original && error.original.code === 'ER_TOO_MANY_KEYS') {
      console.error('💡 解决方案: 请手动清理数据库中的多余索引');
      console.error('📋 临时解决方案: 设置环境变量 SKIP_DB_SYNC=true 跳过数据库同步');
    }
    
    process.exit(1);
  }
}

/**
 * 获取索引统计信息
 */
async function getIndexStats() {
  try {
    const sequelize = new Sequelize(
      process.env.DB_NAME || 'freebackend',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        dialect: 'mysql',
        logging: false,
        timezone: '+08:00'
      }
    );

    await sequelize.authenticate();

    const stats = await sequelize.query(
      `SELECT 
         table_name,
         COUNT(*) as index_count,
         GROUP_CONCAT(index_name) as index_names
       FROM information_schema.statistics 
       WHERE table_schema = ?
       GROUP BY table_name
       ORDER BY index_count DESC`,
      {
        replacements: [sequelize.config.database],
        type: sequelize.QueryTypes.SELECT
      }
    );

    console.log('📊 数据库索引统计:');
    stats.forEach(stat => {
      const status = stat.index_count > 60 ? '🚨' : stat.index_count > 50 ? '⚠️' : '✅';
      console.log(`${status} ${stat.table_name}: ${stat.index_count} 个索引`);
      if (stat.index_count > 50) {
        console.log(`   索引列表: ${stat.index_names}`);
      }
    });

    await sequelize.close();
    
  } catch (error) {
    console.error('获取索引统计失败:', error.message);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'stats') {
  getIndexStats();
} else {
  cleanupIndexes();
}