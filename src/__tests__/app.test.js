const request = require('supertest');
const app = require('../app');

describe('应用程序测试', () => {
  describe('健康检查端点', () => {
    it('应该返回200状态码和健康状态', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('根路径端点', () => {
    it('应该返回欢迎信息', async () => {
      const response = await request(app)
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
    });
  });

  describe('404错误处理', () => {
    it('应该返回404状态码对于不存在的路由', async () => {
      const response = await request(app)
        .get('/nonexistent-route')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('CORS配置', () => {
    it('应该包含正确的CORS头信息', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('安全头信息', () => {
    it('应该包含安全相关的HTTP头', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});