// 加载环境变量
require('dotenv').config();

const sequelize = require('../src/config/database').getSequelize();

async function testConnection() {
    try {
        console.log('🔍 检查数据库连接状态...');
        
        if (!sequelize) {
            console.log('❌ Sequelize实例为null，检查数据库配置');
            console.log('环境变量检查:');
            console.log('DB_HOST:', process.env.DB_HOST);
            console.log('DB_USER:', process.env.DB_USER);
            console.log('DB_NAME:', process.env.DB_NAME);
            return;
        }
        
        console.log('✅ Sequelize实例存在，开始连接测试...');
        
        // 测试连接
        await sequelize.authenticate();
        console.log('✅ 数据库连接成功');
        
        // 检查表是否存在
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('📊 数据库中的表:', tables);
        
        // 检查news表
        const hasNewsTable = tables.includes('news');
        console.log('📰 news表存在:', hasNewsTable);
        
        if (hasNewsTable) {
            const News = require('../src/models/News');
            const count = await News.count();
            console.log('📈 news表数据量:', count);
        }
        
    } catch (error) {
        console.error('❌ 数据库连接失败:', error.message);
        console.error('详细错误信息:', error);
    } finally {
        if (sequelize) {
            await sequelize.close();
            console.log('🔒 数据库连接已关闭');
        }
    }
}

testConnection();