# 新闻API模块使用指南

## 📋 模块概述

新闻API模块是一个独立的测试接口模块，提供API密钥管理和新闻数据查询功能。该模块设计用于测试请求接口，具有以下特点：

- **独立模块设计**：与其他业务模块分离，便于测试和维护
- **API密钥管理**：支持密钥生成、验证和过期控制
- **新闻数据查询**：提供丰富的新闻数据查询接口
- **完整文档**：集成Swagger API文档

## 🚀 快速开始

### 1. 初始化测试数据

运行以下命令初始化测试数据：

```bash
node scripts/init-news-data.js
```

### 2. 启动服务

```bash
npm start
```

### 3. 访问API文档

打开浏览器访问：`http://localhost:3000/api-docs`

## 🔑 API密钥管理

### 生成API密钥

```bash
curl -X POST http://localhost:3000/api/apikeys/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试密钥",
    "description": "用于测试的API密钥",
    "days": 30,
    "requestLimit": 1000
  }'
```

**响应示例：**
```json
{
  "success": true,
  "message": "API密钥生成成功",
  "data": {
    "keyId": 1,
    "apiKey": "a1b2c3d4e5f6...",
    "name": "测试密钥",
    "description": "用于测试的API密钥",
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "requestLimit": 1000,
    "createdAt": "2024-11-30T10:00:00.000Z"
  }
}
```

### 验证API密钥

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/apikeys/validate
```

**响应示例：**
```json
{
  "success": true,
  "message": "API密钥验证成功",
  "data": {
    "keyId": 1,
    "name": "测试密钥",
    "requestCount": 5,
    "requestLimit": 1000
  }
}
```

## 📰 新闻API接口

### 获取新闻列表

```bash
# 基本查询
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/news

# 分页查询
curl -H "x-api-key: YOUR_API_KEY" "http://localhost:3000/api/news?page=2&limit=5"

# 分类筛选
curl -H "x-api-key: YOUR_API_KEY" "http://localhost:3000/api/news?category=technology"

# 关键词搜索
curl -H "x-api-key: YOUR_API_KEY" "http://localhost:3000/api/news?keyword=人工智能"
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "news": [
      {
        "newsId": 1,
        "title": "人工智能技术取得重大突破",
        "content": "近日，研究人员在人工智能领域取得了重大突破...",
        "category": "technology",
        "author": "科技日报",
        "source": "科技新闻社",
        "publishDate": "2024-11-30T10:00:00.000Z",
        "status": "published",
        "viewCount": 123,
        "tags": "人工智能,算法,技术突破",
        "createdAt": "2024-11-30T10:00:00.000Z",
        "updatedAt": "2024-11-30T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10,
      "pages": 1
    },
    "apiKeyInfo": {
      "keyId": 1,
      "name": "测试密钥",
      "requestCount": 6,
      "requestLimit": 1000
    }
  }
}
```

### 获取新闻详情

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/news/1
```

### 获取新闻分类

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/news/categories
```

## 📊 API统计信息

### 获取API使用统计

```bash
curl http://localhost:3000/api/apikeys/stats
```

**响应示例：**
```json
{
  "success": true,
  "data": {
    "totalKeys": 5,
    "activeKeys": 3,
    "expiredKeys": 1,
    "inactiveKeys": 1,
    "todayActiveKeys": 2,
    "statsDate": "2024-11-30T10:00:00.000Z"
  }
}
```

## 🔧 高级功能

### 1. 请求头方式传递API密钥

```bash
curl -H "x-api-key: YOUR_API_KEY" http://localhost:3000/api/news
```

### 2. 查询参数方式传递API密钥

```bash
curl "http://localhost:3000/api/news?apiKey=YOUR_API_KEY"
```

### 3. 禁用API密钥

```bash
curl -X DELETE http://localhost:3000/api/apikeys/1
```

## 🛡️ 安全特性

### API密钥保护
- 密钥存储在数据库中，使用哈希算法保护
- 支持密钥过期时间设置
- 每日请求次数限制
- 密钥状态管理（活跃/禁用/过期）

### 请求限制
- 默认每日1000次请求限制
- 支持自定义请求限制
- 自动重置每日计数器

### 错误处理
- 详细的错误代码和消息
- 统一的错误响应格式
- 安全的信息泄露防护

## 📈 性能优化

### 数据库优化
- 合理的索引设计
- 分页查询支持
- 查询条件优化

### 缓存策略
- 热点数据缓存
- 查询结果缓存
- 缓存失效策略

## 🔍 故障排除

### 常见问题

1. **API密钥无效**
   - 检查密钥是否正确
   - 验证密钥是否过期
   - 检查密钥状态是否为活跃

2. **请求限制超限**
   - 检查当日请求次数
   - 等待次日自动重置
   - 申请更高请求限制的密钥

3. **数据库连接失败**
   - 检查数据库配置
   - 验证数据库连接
   - 检查数据库表结构

### 日志查看

```bash
# 查看应用日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 查看数据库日志
tail -f logs/database.log
```

## 🚀 部署建议

### 生产环境配置

1. **环境变量设置**
```bash
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=freebackend
DB_USER=root
DB_PASSWORD=your_password

# API配置
API_RATE_LIMIT=1000
API_KEY_EXPIRE_DAYS=30

# 安全配置
ENABLE_SOCKET_IO=false
SKIP_DB_SYNC=true
```

2. **Docker部署**
```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=mysql
      - DB_NAME=freebackend
    depends_on:
      - mysql

  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root
      - MYSQL_DATABASE=freebackend
```

## 📚 相关文档

- [API接口文档](http://localhost:3000/api-docs)
- [数据库优化指南](./database-optimization-guide.md)
- [部署指南](./1panel-deployment-guide.md)

## 💡 最佳实践

1. **密钥管理**
   - 为不同应用创建独立的API密钥
   - 定期轮换API密钥
   - 设置合理的过期时间

2. **请求优化**
   - 使用分页查询避免大数据量
   - 合理设置请求频率
   - 使用缓存减少数据库压力

3. **错误处理**
   - 实现重试机制
   - 记录详细的错误日志
   - 设置合理的超时时间

这个新闻API模块为您提供了一个完整的测试接口解决方案，支持灵活的API密钥管理和丰富的新闻数据查询功能。