const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testNewsModule() {
    console.log('🧪 开始测试新闻模块...\n');

    try {
        // 1. 生成API密钥
        console.log('1. 生成API密钥...');
        const generateResponse = await axios.post(`${BASE_URL}/apikeys/generate`, {
            name: '测试密钥',
            description: '用于测试新闻模块的API密钥',
            days: 30,
            requestLimit: 1000
        });
        
        const apiKey = generateResponse.data.data.apiKey;
        console.log('✅ API密钥生成成功:', apiKey.substring(0, 20) + '...');

        // 2. 验证API密钥
        console.log('\n2. 验证API密钥...');
        const validateResponse = await axios.get(`${BASE_URL}/apikeys/validate`, {
            headers: { 'x-api-key': apiKey }
        });
        console.log('✅ API密钥验证成功');

        // 3. 获取新闻列表
        console.log('\n3. 获取新闻列表...');
        const newsResponse = await axios.get(`${BASE_URL}/news`, {
            headers: { 'x-api-key': apiKey }
        });
        
        const newsList = newsResponse.data.data.news;
        console.log(`✅ 获取到 ${newsList.length} 条新闻`);
        
        if (newsList.length > 0) {
            console.log('📰 第一条新闻标题:', newsList[0].title);
        }

        // 4. 获取新闻分类
        console.log('\n4. 获取新闻分类...');
        const categoriesResponse = await axios.get(`${BASE_URL}/news/categories`, {
            headers: { 'x-api-key': apiKey }
        });
        
        const categories = categoriesResponse.data.data.categories;
        console.log('✅ 获取到新闻分类:', categories.join(', '));

        // 5. 获取API统计信息
        console.log('\n5. 获取API统计信息...');
        const statsResponse = await axios.get(`${BASE_URL}/apikeys/stats`);
        
        const stats = statsResponse.data.data;
        console.log('📊 API统计信息:');
        console.log(`   - 总密钥数: ${stats.totalKeys}`);
        console.log(`   - 活跃密钥: ${stats.activeKeys}`);
        console.log(`   - 过期密钥: ${stats.expiredKeys}`);

        console.log('\n🎉 新闻模块测试完成！所有功能正常。');
        console.log('\n📋 使用说明:');
        console.log(`- API密钥: ${apiKey}`);
        console.log('- 新闻列表接口: GET /api/news');
        console.log('- 新闻详情接口: GET /api/news/{id}');
        console.log('- 分类列表接口: GET /api/news/categories');
        console.log('- 密钥验证接口: GET /api/apikeys/validate');

    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
        
        if (error.response?.status === 503) {
            console.log('💡 提示: 请确保服务器正在运行 (npm start)');
        }
    }
}

// 如果服务器未运行，提供启动指南
function showStartupGuide() {
    console.log('🚀 启动指南:');
    console.log('1. 确保数据库连接配置正确');
    console.log('2. 运行: npm start');
    console.log('3. 等待服务器启动完成');
    console.log('4. 运行此测试脚本: node test-news-module.js');
    console.log('\n📚 更多信息请查看: docs/news-api-guide.md');
}

// 检查是否安装了axios
try {
    require('axios');
} catch (error) {
    console.log('📦 安装依赖...');
    console.log('请运行: npm install axios');
    process.exit(1);
}

testNewsModule().catch(error => {
    console.error('测试脚本执行失败:', error);
    showStartupGuide();
});