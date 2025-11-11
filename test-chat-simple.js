/**
 * 聊天功能简化测试脚本
 * 使用HTTP请求测试REST API，无需socket.io-client依赖
 */

const http = require('http');

class SimpleChatTester {
  constructor(host = 'localhost', port = 3000) {
    this.host = host;
    this.port = port;
    this.baseUrl = `http://${host}:${port}`;
  }

  // 发送HTTP请求
  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const result = {
              statusCode: res.statusCode,
              headers: res.headers,
              data: responseData ? JSON.parse(responseData) : null
            };
            resolve(result);
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`请求失败: ${error.message}`));
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  // 测试健康检查
  async testHealth() {
    console.log('🧪 测试健康检查...');
    try {
      const result = await this.request('GET', '/health');
      if (result.statusCode === 200) {
        console.log('✅ 健康检查通过');
        return true;
      } else {
        console.log('❌ 健康检查失败:', result.statusCode);
        return false;
      }
    } catch (error) {
      console.log('❌ 健康检查错误:', error.message);
      return false;
    }
  }

  // 测试获取房间信息
  async testGetRoomInfo(roomId = 'general') {
    console.log(`🧪 测试获取房间信息 (${roomId})...`);
    try {
      const result = await this.request('GET', `/api/chat/rooms/${roomId}`);
      if (result.statusCode === 200) {
        console.log('✅ 获取房间信息成功');
        console.log('   房间信息:', JSON.stringify(result.data, null, 2));
        return true;
      } else {
        console.log('❌ 获取房间信息失败:', result.statusCode);
        return false;
      }
    } catch (error) {
      console.log('❌ 获取房间信息错误:', error.message);
      return false;
    }
  }

  // 测试获取聊天历史
  async testGetChatHistory(roomId = 'general') {
    console.log(`🧪 测试获取聊天历史 (${roomId})...`);
    try {
      const result = await this.request('GET', `/api/chat/rooms/${roomId}/messages?limit=5`);
      if (result.statusCode === 200) {
        console.log('✅ 获取聊天历史成功');
        const messages = result.data?.data?.messages || [];
        console.log(`   共 ${messages.length} 条消息`);
        return true;
      } else {
        console.log('❌ 获取聊天历史失败:', result.statusCode);
        return false;
      }
    } catch (error) {
      console.log('❌ 获取聊天历史错误:', error.message);
      return false;
    }
  }

  // 测试搜索消息
  async testSearchMessages(roomId = 'general', query = 'test') {
    console.log(`🧪 测试搜索消息 (${roomId}, "${query}")...`);
    try {
      const result = await this.request('GET', `/api/chat/rooms/${roomId}/search?q=${encodeURIComponent(query)}`);
      if (result.statusCode === 200) {
        console.log('✅ 搜索消息成功');
        const messages = result.data?.data?.messages || [];
        console.log(`   找到 ${messages.length} 条相关消息`);
        return true;
      } else {
        console.log('❌ 搜索消息失败:', result.statusCode);
        return false;
      }
    } catch (error) {
      console.log('❌ 搜索消息错误:', error.message);
      return false;
    }
  }

  // 测试获取聊天统计
  async testGetChatStats() {
    console.log('🧪 测试获取聊天统计...');
    try {
      const result = await this.request('GET', '/api/chat/stats');
      if (result.statusCode === 200) {
        console.log('✅ 获取聊天统计成功');
        console.log('   统计信息:', JSON.stringify(result.data, null, 2));
        return true;
      } else {
        console.log('❌ 获取聊天统计失败:', result.statusCode);
        return false;
      }
    } catch (error) {
      console.log('❌ 获取聊天统计错误:', error.message);
      return false;
    }
  }

  // 测试API文档
  async testAPIDocs() {
    console.log('🧪 测试API文档...');
    try {
      const result = await this.request('GET', '/api-docs');
      if (result.statusCode === 200 || result.statusCode === 301) {
        console.log('✅ API文档可访问');
        return true;
      } else {
        console.log('❌ API文档访问失败:', result.statusCode);
        return false;
      }
    } catch (error) {
      console.log('❌ API文档访问错误:', error.message);
      return false;
    }
  }

  // 运行所有测试
  async runAllTests() {
    console.log('🚀 开始聊天功能简化测试...\n');

    const tests = [
      { name: '健康检查', method: this.testHealth.bind(this) },
      { name: 'API文档', method: this.testAPIDocs.bind(this) },
      { name: '房间信息', method: this.testGetRoomInfo.bind(this) },
      { name: '聊天历史', method: this.testGetChatHistory.bind(this) },
      { name: '消息搜索', method: this.testSearchMessages.bind(this) },
      { name: '聊天统计', method: this.testGetChatStats.bind(this) }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      console.log(`\n--- ${test.name} ---`);
      const success = await test.method();
      if (success) {
        passed++;
      } else {
        failed++;
      }
      // 测试间短暂延迟
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n📊 测试结果汇总:');
    console.log(`✅ 通过: ${passed}`);
    console.log(`❌ 失败: ${failed}`);
    console.log(`📈 成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);

    if (failed === 0) {
      console.log('\n🎉 所有测试通过！聊天功能REST API工作正常。');
      console.log('💡 提示：Socket.IO实时功能需要额外的socket.io-client依赖。');
    } else {
      console.log('\n⚠️  部分测试失败，请检查服务器是否正常运行。');
    }

    return failed === 0;
  }
}

// 如果直接运行此文件
if (require.main === module) {
  const tester = new SimpleChatTester();
  
  tester.runAllTests().then(success => {
    if (success) {
      console.log('\n✨ 聊天功能测试完成！');
    } else {
      console.log('\n🔧 请检查服务器状态和配置。');
    }
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('测试过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = SimpleChatTester;