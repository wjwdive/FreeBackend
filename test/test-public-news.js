const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPublicNewsModule() {
    console.log('🧪 开始测试公开新闻模块（无需API密钥）...\n');

    try {
        // 1. 获取新闻列表
        console.log('1. 获取公开新闻列表...');
        const newsResponse = await axios.get(`${BASE_URL}/public/news`);
        
        const newsList = newsResponse.data.data.news;
        console.log(`✅ 获取到 ${newsList.length} 条新闻`);
        
        if (newsList.length > 0) {
            console.log('📰 第一条新闻标题:', newsList[0].title);
        }

        // 2. 获取新闻详情
        console.log('\n2. 获取公开新闻详情...');
        if (newsList.length > 0) {
            const detailResponse = await axios.get(`${BASE_URL}/public/news/${newsList[0].newsId}`);
            console.log('✅ 获取新闻详情成功');
            console.log('📖 新闻内容:', detailResponse.data.data.news.content.substring(0, 100) + '...');
        }

        // 3. 获取新闻分类
        console.log('\n3. 获取公开新闻分类...');
        const categoriesResponse = await axios.get(`${BASE_URL}/public/news/categories`);
        
        const categories = categoriesResponse.data.data.categories;
        console.log('✅ 获取到新闻分类:');
        categories.forEach(cat => {
            console.log(`   - ${cat.label} (${cat.value}): ${cat.count} 条新闻`);
        });

        // 4. 测试分页查询
        console.log('\n4. 测试分页查询...');
        const pageResponse = await axios.get(`${BASE_URL}/public/news?page=1&limit=5`);
        console.log(`✅ 分页查询成功: 第1页，每页5条`);

        // 5. 测试分类筛选
        console.log('\n5. 测试分类筛选...');
        const categoryResponse = await axios.get(`${BASE_URL}/public/news?category=technology`);
        console.log(`✅ 分类筛选成功: 科技类新闻`);

        console.log('\n🎉 公开新闻模块测试完成！所有功能正常。');
        console.log('\n📋 公开新闻接口使用说明:');
        console.log('- 新闻列表接口: GET /api/public/news');
        console.log('- 新闻详情接口: GET /api/public/news/{id}');
        console.log('- 分类列表接口: GET /api/public/news/categories');
        console.log('- 分页查询: GET /api/public/news?page=1&limit=10');
        console.log('- 分类筛选: GET /api/public/news?category=technology');
        console.log('- 关键词搜索: GET /api/public/news?keyword=关键词');
        console.log('\n💡 特点: 无需API密钥，无需登录，完全公开访问！');

    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
        
        if (error.response?.status === 503) {
            console.log('💡 提示: 请确保服务器正在运行 (npm start)');
        }
    }
}

// 检查是否安装了axios
try {
    require('axios');
} catch (error) {
    console.log('📦 安装依赖...');
    console.log('请运行: npm install axios');
    process.exit(1);
}

testPublicNewsModule().catch(error => {
    console.error('测试脚本执行失败:', error);
    console.log('\n🚀 启动指南:');
    console.log('1. 确保数据库连接配置正确');
    console.log('2. 运行初始化脚本: node scripts/init-news-data.js');
    console.log('3. 启动服务器: npm start');
    console.log('4. 运行此测试脚本: node test-public-news.js');
});