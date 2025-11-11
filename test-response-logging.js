const request = require('supertest');
const server = require('./src/app');

/**
 * 测试响应日志功能
 */
async function testResponseLogging() {
  console.log('=== 开始测试响应日志功能 ===\n');
  
  try {
    // 测试健康检查接口
    console.log('1. 测试健康检查接口...');
    const healthResponse = await request(server)
      .get('/health')
      .expect(200);
    
    console.log('✅ 健康检查接口测试成功');
    console.log('响应数据:', JSON.stringify(healthResponse.body, null, 2));
    
    // 测试认证接口（注册）
    console.log('\n2. 测试用户注册接口...');
    const registerResponse = await request(server)
      .post('/api/auth/register')
      .send({
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Test123456!',
        role: 'user'
      })
      .expect(201);
    
    console.log('✅ 用户注册接口测试成功');
    console.log('响应状态码:', registerResponse.status);
    
    // 测试认证接口（登录）
    console.log('\n3. 测试用户登录接口...');
    const loginResponse = await request(server)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'Test123456!'
      });
    
    if (loginResponse.status === 200) {
      console.log('✅ 用户登录接口测试成功');
      console.log('响应状态码:', loginResponse.status);
      
      const token = loginResponse.body.data?.token;
      
      if (token) {
        // 测试需要认证的接口
        console.log('\n4. 测试需要认证的用户接口...');
        const profileResponse = await request(server)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);
        
        console.log('✅ 用户信息接口测试成功');
        console.log('响应状态码:', profileResponse.status);
      }
    } else {
      console.log('⚠️ 用户登录失败（可能是测试用户不存在）');
      console.log('响应状态码:', loginResponse.status);
      console.log('响应信息:', loginResponse.body.message);
    }
    
    // 测试工具接口
    console.log('\n5. 测试工具接口...');
    const toolsResponse = await request(server)
      .get('/api/tools/health')
      .expect(200);
    
    console.log('✅ 工具接口测试成功');
    console.log('响应状态码:', toolsResponse.status);
    
    // 测试不存在的接口
    console.log('\n6. 测试不存在的接口...');
    const notFoundResponse = await request(server)
      .get('/api/nonexistent')
      .expect(404);
    
    console.log('✅ 404接口测试成功');
    console.log('响应状态码:', notFoundResponse.status);
    
    console.log('\n=== 响应日志功能测试完成 ===');
    console.log('\n📝 请检查日志文件查看详细的接口响应日志：');
    console.log('   - ./logs/combined.log (所有日志)');
    console.log('   - ./logs/error.log (错误日志)');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error.message);
    if (error.response) {
      console.error('响应状态码:', error.response.status);
      console.error('响应数据:', error.response.body);
    }
  }
}

// 运行测试
testResponseLogging().then(() => {
  console.log('\n测试脚本执行完成');
  process.exit(0);
}).catch(error => {
  console.error('测试脚本执行失败:', error);
  process.exit(1);
});