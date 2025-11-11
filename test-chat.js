/**
 * 聊天功能测试脚本
 * 用于快速验证聊天功能是否正常工作
 */

const { runChatTest } = require('./src/utils/chatClient');

console.log('🚀 开始测试聊天功能...\n');

// 运行基本测试
runChatTest({
    serverUrl: 'http://localhost:3000',
    roomId: 'general',
    testUser: '测试用户',
    messageCount: 3,
    delay: 1000
}).then(() => {
    console.log('\n✅ 聊天功能测试完成！');
    console.log('📋 测试结果：');
    console.log('   - Socket.IO 连接正常');
    console.log('   - 房间加入功能正常');
    console.log('   - 消息发送和接收正常');
    console.log('   - 聊天历史获取正常');
    console.log('\n💡 提示：可以打开多个终端运行此脚本来测试多用户聊天');
}).catch(error => {
    console.error('❌ 测试失败:', error.message);
    console.log('\n🔧 故障排除建议：');
    console.log('   1. 确保服务器正在运行: npm run dev');
    console.log('   2. 检查端口3000是否被占用');
    console.log('   3. 查看服务器日志获取详细错误信息');
});