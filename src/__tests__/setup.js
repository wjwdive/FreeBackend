// 测试环境设置
const dotenv = require('dotenv');

// 加载测试环境变量
dotenv.config({ path: '.env.test' });

// 设置测试超时时间
jest.setTimeout(30000);

// 全局测试钩子
beforeAll(async () => {
  console.log('开始测试套件...');
});

afterAll(async () => {
  console.log('测试套件完成');
});

// 全局测试辅助函数
global.createTestUser = () => ({
  username: `testuser_${Date.now()}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPassword123!',
});

global.createTestToken = () => {
  // 模拟JWT令牌
  return 'test.jwt.token.mock';
};

// 模拟console方法以避免测试输出干扰
const originalConsole = { ...console };
beforeEach(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});