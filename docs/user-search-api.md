# 用户模糊查询 API 文档

## 概述

本文档描述了 FreeBackend 项目中新增的用户模糊查询功能，支持多种搜索方式和智能排序。

## API 端点

### 1. 基础模糊搜索

**端点**: `GET /api/users/search`

**描述**: 基础模糊搜索，支持按用户名、邮箱、角色进行搜索

**查询参数**:
- `q` (必需): 搜索关键词，至少2个字符
- `limit` (可选): 返回结果数量限制，默认20
- `type` (可选): 搜索类型，可选值：`all`(全部字段)、`username`(仅用户名)、`email`(仅邮箱)，默认`all`

**示例请求**:
```bash
# 搜索包含"john"的用户
GET /api/users/search?q=john&limit=10&type=all

# 仅搜索用户名包含"admin"的用户
GET /api/users/search?q=admin&type=username
```

**响应示例**:
```json
{
  "statusCode": 200,
  "message": "用户搜索成功",
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com",
        "role": "user",
        "status": "active",
        "lastLoginAt": "2024-01-15T10:30:00.000Z",
        "loginCount": 5,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "searchInfo": {
      "keyword": "john",
      "type": "all",
      "total": 1,
      "limit": 10
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### 2. 高级搜索

**端点**: `GET /api/users/advanced-search`

**描述**: 高级模糊搜索，支持多条件组合查询

**查询参数**:
- `keyword` (可选): 搜索关键词，至少2个字符
- `role` (可选): 角色过滤，可选值：`user`、`admin`
- `status` (可选): 状态过滤，可选值：`active`、`inactive`、`banned`
- `limit` (可选): 返回结果数量限制，默认20

**示例请求**:
```bash
# 搜索活跃的管理员用户
GET /api/users/advanced-search?keyword=admin&role=admin&status=active

# 搜索所有包含"test"的用户
GET /api/users/advanced-search?keyword=test
```

**响应示例**:
```json
{
  "statusCode": 200,
  "message": "高级搜索成功",
  "data": {
    "users": [
      {
        "id": 2,
        "username": "admin_user",
        "email": "admin@example.com",
        "role": "admin",
        "status": "active",
        "lastLoginAt": "2024-01-15T09:00:00.000Z",
        "loginCount": 10,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T09:00:00.000Z"
      }
    ],
    "searchInfo": {
      "keyword": "admin",
      "role": "admin",
      "status": "active",
      "total": 1,
      "limit": 20
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

### 3. 搜索建议

**端点**: `GET /api/users/search-suggestions`

**描述**: 获取搜索建议，用于前端自动补全功能

**查询参数**:
- `q` (必需): 搜索关键词
- `limit` (可选): 返回结果数量限制，默认10

**示例请求**:
```bash
# 获取以"jo"开头的用户建议
GET /api/users/search-suggestions?q=jo&limit=5
```

**响应示例**:
```json
{
  "statusCode": 200,
  "message": "搜索建议获取成功",
  "data": {
    "suggestions": [
      {
        "id": 1,
        "username": "john_doe",
        "email": "john@example.com"
      },
      {
        "id": 3,
        "username": "joe_smith",
        "email": "joe@example.com"
      }
    ],
    "searchInfo": {
      "keyword": "jo",
      "total": 2,
      "limit": 5
    }
  },
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

## 搜索特性

### 智能排序

搜索结果按以下优先级排序：
1. **完全匹配**: 用户名或邮箱完全等于搜索关键词
2. **前缀匹配**: 用户名或邮箱以搜索关键词开头
3. **其他匹配**: 用户名或邮箱包含搜索关键词
4. **时间排序**: 按创建时间倒序排列

### 搜索策略

- **短关键词** (2-3个字符): 仅进行前缀匹配，提高搜索效率
- **长关键词** (4个字符以上): 进行全字段模糊匹配
- **状态过滤**: 默认只搜索活跃用户 (`status: 'active'`)

### 性能优化

- 使用数据库索引优化模糊查询性能
- 限制返回结果数量，防止数据过大
- 支持搜索类型过滤，减少不必要的字段查询

## 错误处理

### 常见错误响应

```json
{
  "statusCode": 400,
  "message": "搜索关键词至少需要2个字符",
  "data": null,
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

```json
{
  "statusCode": 400,
  "message": "搜索关键词不能为空",
  "data": null,
  "timestamp": "2024-01-15T10:35:00.000Z"
}
```

## 使用建议

1. **前端实现**: 使用搜索建议功能实现自动补全
2. **性能考虑**: 对于大数据量，建议使用分页查询
3. **用户体验**: 根据搜索词长度提供不同的搜索策略
4. **安全性**: 所有搜索接口都需要认证，确保数据安全

## 版本历史

- v1.0.0: 基础模糊搜索功能
- v1.1.0: 新增高级搜索和搜索建议功能
- v1.1.1: 优化搜索排序算法和性能