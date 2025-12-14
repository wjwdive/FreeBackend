#!/usr/bin/env node

/**
 * 新闻测试数据初始化脚本
 * 为新闻模块添加示例数据
 */

const News = require('../src/models/News');
const ApiKey = require('../src/models/ApiKey');

/**
 * 示例新闻数据
 */
const sampleNews = [
  {
    title: "人工智能技术取得重大突破",
    content: "近日，研究人员在人工智能领域取得了重大突破，新的算法模型在多个基准测试中表现优异。这项技术有望在医疗、金融等领域发挥重要作用。",
    category: "technology",
    author: "科技日报",
    source: "科技新闻社",
    tags: "人工智能,算法,技术突破"
  },
  {
    title: "国际足球锦标赛圆满落幕",
    content: "经过激烈角逐，国际足球锦标赛于昨日圆满落幕。冠军队伍在决赛中表现出色，赢得了观众的热烈掌声。",
    category: "sports",
    author: "体育周刊",
    source: "体育新闻",
    tags: "足球,锦标赛,体育"
  },
  {
    title: "新电影《星际探索》票房大卖",
    content: "科幻电影《星际探索》上映首周即取得票房佳绩，观众对影片的特效和剧情给予高度评价。",
    category: "entertainment",
    author: "娱乐快报",
    source: "电影资讯",
    tags: "电影,科幻,票房"
  },
  {
    title: "国际领导人峰会达成重要共识",
    content: "在多国领导人参加的峰会上，各方就全球经济合作达成重要共识，为未来发展奠定基础。",
    category: "politics",
    author: "政治观察",
    source: "国际新闻",
    tags: "政治,峰会,国际合作"
  },
  {
    title: "科技公司发布季度财报，业绩超预期",
    content: "知名科技公司发布最新季度财报，营收和利润均超出市场预期，股价应声上涨。",
    category: "business",
    author: "财经日报",
    source: "财经新闻",
    tags: "财报,科技股,业绩"
  },
  {
    title: "5G技术推动物联网发展",
    content: "随着5G技术的普及，物联网应用场景不断扩展，为智慧城市和工业4.0提供有力支撑。",
    category: "technology",
    author: "通信技术",
    source: "技术前沿",
    tags: "5G,物联网,智慧城市"
  },
  {
    title: "篮球联赛新赛季即将开始",
    content: "职业篮球联赛新赛季即将拉开帷幕，各支球队已完成阵容调整，准备迎接新的挑战。",
    category: "sports",
    author: "体育世界",
    source: "篮球新闻",
    tags: "篮球,联赛,新赛季"
  },
  {
    title: "音乐节吸引数万观众参与",
    content: "年度音乐节成功举办，吸引了来自全国各地的数万名音乐爱好者，现场气氛热烈。",
    category: "entertainment",
    author: "音乐之声",
    source: "娱乐新闻",
    tags: "音乐节,演唱会,娱乐"
  },
  {
    title: "环保政策推动绿色经济发展",
    content: "政府出台新的环保政策，旨在推动绿色经济发展，促进可持续发展目标的实现。",
    category: "politics",
    author: "政策研究",
    source: "政策新闻",
    tags: "环保,政策,可持续发展"
  },
  {
    title: "电商平台推出双十一促销活动",
    content: "各大电商平台纷纷推出双十一促销活动，预计将创造新的销售记录。",
    category: "business",
    author: "电商观察",
    source: "商业新闻",
    tags: "电商,促销,双十一"
  }
];

/**
 * 初始化新闻数据
 */
async function initNewsData() {
  console.log('📰 开始初始化新闻测试数据...');
  
  try {
    // 检查是否已有数据
    const existingCount = await News.count();
    
    if (existingCount > 0) {
      console.log(`✅ 数据库中已有 ${existingCount} 条新闻数据，跳过初始化`);
      return;
    }

    // 添加发布日期（分散在过去30天内）
    const newsWithDates = sampleNews.map((news, index) => {
      const publishDate = new Date();
      publishDate.setDate(publishDate.getDate() - (30 - index));
      
      return {
        ...news,
        publishDate,
        status: 'published',
        viewCount: Math.floor(Math.random() * 1000)
      };
    });

    // 批量创建新闻数据
    await News.bulkCreate(newsWithDates);
    
    console.log(`✅ 成功创建 ${newsWithDates.length} 条新闻测试数据`);
    
    // 显示分类统计
    const categories = ['technology', 'sports', 'entertainment', 'politics', 'business'];
    for (const category of categories) {
      const count = await News.count({ where: { category, status: 'published' } });
      console.log(`   📊 ${category}: ${count} 条新闻`);
    }
    
  } catch (error) {
    console.error('❌ 初始化新闻数据失败:', error.message);
    process.exit(1);
  }
}

/**
 * 初始化测试API密钥
 */
async function initTestApiKeys() {
  console.log('🔑 开始初始化测试API密钥...');
  
  try {
    // 检查是否已有测试密钥
    const existingKey = await ApiKey.findOne({ where: { name: '测试密钥' } });
    
    if (existingKey) {
      console.log('✅ 测试API密钥已存在，跳过创建');
      return existingKey.apiKey;
    }

    // 创建测试API密钥
    const testKey = await ApiKey.generateKey({
      name: '测试密钥',
      description: '用于测试新闻API功能的密钥',
      days: 365,
      requestLimit: 10000
    });

    console.log('✅ 测试API密钥创建成功');
    console.log(`   🔑 API密钥: ${testKey.apiKey}`);
    console.log(`   📅 过期时间: ${testKey.expiresAt}`);
    console.log(`   📊 请求限制: ${testKey.requestLimit} 次/天`);
    
    return testKey.apiKey;
    
  } catch (error) {
    console.error('❌ 初始化测试API密钥失败:', error.message);
    process.exit(1);
  }
}

/**
 * 显示使用说明
 */
function showUsage(apiKey) {
  console.log('\n📋 新闻API使用说明:');
  console.log('='.repeat(50));
  console.log('\n🔑 API密钥验证:');
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/apikeys/validate`);
  
  console.log('\n📰 获取新闻列表:');
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/news`);
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/news?page=2&limit=5`);
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/news?category=technology`);
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/news?keyword=人工智能`);
  
  console.log('\n📖 获取新闻详情:');
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/news/1`);
  
  console.log('\n📊 获取分类列表:');
  console.log(`    curl -H "x-api-key: ${apiKey}" http://localhost:3001/api/news/categories`);
  
  console.log('\n🔧 生成新API密钥:');
  console.log('    curl -X POST http://localhost:3001/api/apikeys/generate \\');
  console.log('         -H "Content-Type: application/json" \\');
  console.log('         -d \'{"name":"我的密钥","description":"个人使用","days":30,"requestLimit":1000}\'');
  
  console.log('\n📈 查看API统计:');
  console.log('    curl http://localhost:3001/api/apikeys/stats');
  
  console.log('\n🌐 API文档:');
  console.log('    http://localhost:3001/api-docs');
  console.log('='.repeat(50));
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 新闻模块测试数据初始化');
  console.log('='.repeat(50));
  
  try {
    // 初始化新闻数据
    await initNewsData();
    
    // 初始化测试API密钥
    const apiKey = await initTestApiKeys();
    
    // 显示使用说明
    showUsage(apiKey);
    
    console.log('\n✅ 初始化完成！');
    
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
    process.exit(1);
  }
}

// 如果是直接运行此文件，则执行主函数
if (require.main === module) {
  main();
}

module.exports = { initNewsData, initTestApiKeys };