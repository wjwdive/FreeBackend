# 聊天功能 API 文档

## 概述

FreeBackend 提供了一个完整的实时聊天系统，支持多房间聊天、消息历史、在线用户管理等功能。系统基于 Socket.IO 实现实时通信，同时提供 REST API 进行消息管理。

## 功能特性

- ✅ 实时消息发送和接收
- ✅ 多房间聊天支持
- ✅ 消息历史记录
- ✅ 在线用户管理
- ✅ 输入状态指示
- ✅ 消息已读状态
- ✅ 消息搜索功能
- ✅ 消息删除（发送者或管理员）
- ✅ 自动清理过期消息
- ✅ 完整的错误处理
- ✅ JWT 认证集成

## Socket.IO 事件

### 客户端发送事件

#### `join_room` - 加入房间
```javascript
socket.emit('join_room', {
  roomId: '房间ID'
});
```

#### `leave_room` - 离开房间
```javascript
socket.emit('leave_room', {
  roomId: '房间ID'
});
```

#### `send_message` - 发送消息
```javascript
socket.emit('send_message', {
  roomId: '房间ID',
  content: '消息内容',
  type: 'text' // 可选：text, image, file, system
});
```

#### `get_chat_history` - 获取聊天历史
```javascript
socket.emit('get_chat_history', {
  roomId: '房间ID',
  limit: 50,    // 可选，默认50
  offset: 0     // 可选，默认0
});
```

#### `get_online_users` - 获取在线用户
```javascript
socket.emit('get_online_users');
```

#### `typing_start` - 开始输入
```javascript
socket.emit('typing_start', {
  roomId: '房间ID'
});
```

#### `typing_stop` - 停止输入
```javascript
socket.emit('typing_stop', {
  roomId: '房间ID'
});
```

#### `mark_message_read` - 标记消息已读
```javascript
socket.emit('mark_message_read', {
  messageId: '消息ID',
  roomId: '房间ID'
});
```

### 服务器发送事件

#### `new_message` - 新消息
```javascript
{
  id: '消息ID',
  roomId: '房间ID',
  senderId: '发送者ID',
  senderName: '发送者名称',
  content: '消息内容',
  type: '消息类型',
  timestamp: '时间戳',
  readBy: ['已读用户ID列表']
}
```

#### `user_joined` - 用户加入房间
```javascript
{
  userId: '用户ID',
  username: '用户名称',
  roomId: '房间ID',
  timestamp: '时间戳'
}
```

#### `user_left` - 用户离开房间
```javascript
{
  userId: '用户ID',
  username: '用户名称',
  roomId: '房间ID',
  timestamp: '时间戳'
}
```

#### `user_typing` - 用户正在输入
```javascript
{
  userId: '用户ID',
  username: '用户名称',
  roomId: '房间ID'
}
```

#### `user_stop_typing` - 用户停止输入
```javascript
{
  userId: '用户ID',
  username: '用户名称',
  roomId: '房间ID'
}
```

#### `message_read` - 消息已读
```javascript
{
  messageId: '消息ID',
  readerId: '阅读者ID',
  readerName: '阅读者名称',
  timestamp: '时间戳'
}
```

#### `online_users_updated` - 在线用户更新
```javascript
{
  users: [
    {
      userId: '用户ID',
      username: '用户名称',
      connectedAt: '连接时间'
    }
  ]
}
```

#### `join_success` - 加入成功
```javascript
{
  roomId: '房间ID',
  message: '成功消息'
}
```

#### `message_sent` - 消息发送成功
```javascript
{
  messageId: '消息ID'
}
```

#### `chat_history` - 聊天历史
```javascript
{
  roomId: '房间ID',
  messages: [消息数组],
  hasMore: true/false
}
```

#### `online_users` - 在线用户列表
```javascript
{
  users: [用户数组]
}
```

#### `error` - 错误信息
```javascript
{
  message: '错误描述'
}
```

## REST API 端点

### 获取房间信息
```http
GET /api/chat/rooms/{roomId}
```

### 获取聊天历史
```http
GET /api/chat/rooms/{roomId}/messages?limit=50&offset=0
```

### 搜索消息
```http
GET /api/chat/rooms/{roomId}/search?q=关键词&limit=20
```

### 获取聊天统计
```http
GET /api/chat/stats
```

### 创建房间（需要认证）
```http
POST /api/chat/rooms
Content-Type: application/json
Authorization: Bearer {token}

{
  "roomId": "房间ID",
  "roomName": "房间名称",
  "description": "房间描述"
}
```

### 删除消息（需要认证）
```http
DELETE /api/chat/messages/{messageId}
Authorization: Bearer {token}
```

### 清理过期消息（需要管理员权限）
```http
POST /api/chat/cleanup?hours=24
Authorization: Bearer {token}
```

## 客户端连接示例

### JavaScript 客户端

```javascript
import io from 'socket.io-client';

// 连接服务器
const socket = io('http://localhost:3000', {
  auth: {
    token: '你的JWT令牌'
  }
});

// 连接成功
socket.on('connect', () => {
  console.log('连接成功');
  
  // 加入房间
  socket.emit('join_room', { roomId: 'general' });
});

// 接收新消息
socket.on('new_message', (message) => {
  console.log(`[${message.roomId}] ${message.senderName}: ${message.content}`);
});

// 用户加入房间
socket.on('user_joined', (data) => {
  console.log(`${data.username} 加入了房间 ${data.roomId}`);
});

// 发送消息
function sendMessage(content) {
  socket.emit('send_message', {
    roomId: 'general',
    content: content,
    type: 'text'
  });
}

// 获取聊天历史
function getChatHistory() {
  socket.emit('get_chat_history', {
    roomId: 'general',
    limit: 50,
    offset: 0
  });
}
```

### Node.js 测试客户端

项目提供了测试客户端工具，可以快速测试聊天功能：

```javascript
const { runChatTest } = require('./src/utils/chatClient');

// 运行测试
runChatTest();
```

## 认证机制

聊天系统使用 JWT 进行认证：

1. 客户端需要在连接时提供有效的 JWT token
2. Token 可以通过认证 API 获取
3. Socket.IO 连接会自动验证 token
4. 无效的 token 会导致连接被拒绝

### 连接示例

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
});
```

或者通过查询参数：

```javascript
const socket = io('http://localhost:3000?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
```

## 房间管理

### 预定义房间

系统默认提供以下房间：
- `general` - 通用聊天室
- `tech` - 技术讨论
- `random` - 随机聊天

### 动态房间

可以通过 REST API 创建新的房间：

```javascript
// 创建新房间
fetch('/api/chat/rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    roomId: 'new-room',
    roomName: '新房间',
    description: '这是一个新创建的聊天室'
  })
});
```

## 消息类型

支持的消息类型：

- `text` - 文本消息（默认）
- `image` - 图片消息
- `file` - 文件消息
- `system` - 系统消息

## 错误处理

所有操作都包含完整的错误处理：

- 连接失败会触发 `connect_error` 事件
- 认证失败会触发 `error` 事件
- 业务逻辑错误会通过 `error` 事件返回

### 错误示例

```javascript
socket.on('error', (error) => {
  console.error('发生错误:', error.message);
});

socket.on('connect_error', (error) => {
  console.error('连接失败:', error.message);
});
```

## 性能优化

### 消息分页

聊天历史支持分页获取，避免一次性加载过多消息：

```javascript
// 获取最新的50条消息
socket.emit('get_chat_history', {
  roomId: 'general',
  limit: 50,
  offset: 0
});

// 获取更早的消息
socket.emit('get_chat_history', {
  roomId: 'general',
  limit: 50,
  offset: 50
});
```

### 自动清理

系统会自动清理过期消息（默认保留30天），也可以通过 API 手动清理：

```javascript
// 清理24小时前的消息
fetch('/api/chat/cleanup?hours=24', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + adminToken
  }
});
```

## 安全考虑

1. **认证授权**：所有操作都需要有效的 JWT token
2. **输入验证**：消息内容和服务端验证
3. **速率限制**：防止滥用和DDoS攻击
4. **XSS防护**：客户端应对消息内容进行转义
5. **数据清理**：定期清理过期数据

## 部署说明

### 环境变量

```bash
# Socket.IO 配置
CHAT_MAX_MESSAGE_LENGTH=1000
CHAT_MAX_ROOMS_PER_USER=10
CHAT_MESSAGE_RETENTION_DAYS=30
CHAT_CLEANUP_INTERVAL=86400000
CHAT_ALLOW_FILE_UPLOAD=true
CHAT_MAX_FILE_SIZE=5242880

# 认证配置
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
```

### 生产环境配置

```javascript
// 生产环境应该使用更严格的配置
const io = new Server(server, {
  cors: {
    origin: ['https://yourdomain.com'], // 只允许特定域名
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6
});
```

## 故障排除

### 常见问题

1. **连接失败**：检查服务器地址和端口
2. **认证失败**：确认 token 有效且未过期
3. **消息发送失败**：检查房间ID和消息内容
4. **历史记录为空**：确认房间存在且有消息

### 日志查看

服务器会记录详细的连接和消息日志，可以通过日志排查问题：

```bash
# 查看连接日志
tail -f logs/combined.log | grep socket

# 查看错误日志
tail -f logs/error.log | grep chat
```

## 扩展开发

### 添加新功能

1. 在 `src/socket/index.js` 中添加新的事件处理器
2. 在 `src/services/chatService.js` 中添加业务逻辑
3. 在 `src/controllers/chatController.js` 中添加 REST API
4. 更新 API 文档

### 自定义消息类型

```javascript
// 添加自定义消息类型
socket.emit('send_message', {
  roomId: 'general',
  content: '自定义消息',
  type: 'custom',
  customData: {
    // 自定义字段
  }
});
```

这个文档提供了完整的聊天功能说明，包括使用方法、API 接口和开发指南。