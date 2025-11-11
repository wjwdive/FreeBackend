# FreeBackend 聊天功能快速启动指南

## 🚀 快速开始

### 1. 启动服务器

```bash
# 安装依赖
npm install

# 开发模式启动
npm run dev

# 生产模式启动
npm start
```

服务器将在 `http://localhost:3000` 启动

### 2. 测试聊天功能

项目内置了测试客户端，可以快速验证聊天功能：

```bash
# 运行聊天测试
node -e "require('./src/utils/chatClient').runChatTest()"
```

或者创建测试脚本：

```javascript
// test-chat.js
const { runChatTest } = require('./src/utils/chatClient');
runChatTest();
```

### 3. 前端集成示例

#### HTML + JavaScript 示例

```html
<!DOCTYPE html>
<html>
<head>
    <title>聊天测试</title>
    <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>
</head>
<body>
    <div id="chat">
        <div id="messages"></div>
        <input type="text" id="messageInput" placeholder="输入消息...">
        <button onclick="sendMessage()">发送</button>
    </div>

    <script>
        // 连接服务器（需要先获取有效的JWT token）
        const socket = io('http://localhost:3000', {
            auth: {
                token: 'your-jwt-token-here' // 替换为实际token
            }
        });

        // 连接成功
        socket.on('connect', () => {
            console.log('连接成功');
            
            // 加入通用聊天室
            socket.emit('join_room', { roomId: 'general' });
        });

        // 接收新消息
        socket.on('new_message', (message) => {
            const messagesDiv = document.getElementById('messages');
            const messageElement = document.createElement('div');
            messageElement.innerHTML = `
                <strong>${message.senderName}:</strong> ${message.content}
                <small>${new Date(message.timestamp).toLocaleTimeString()}</small>
            `;
            messagesDiv.appendChild(messageElement);
        });

        // 发送消息
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();
            
            if (content) {
                socket.emit('send_message', {
                    roomId: 'general',
                    content: content,
                    type: 'text'
                });
                input.value = '';
            }
        }

        // 回车发送
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
```

## 🔧 API 快速参考

### Socket.IO 核心事件

```javascript
// 加入房间
socket.emit('join_room', { roomId: 'general' });

// 发送消息
socket.emit('send_message', {
    roomId: 'general',
    content: 'Hello World!',
    type: 'text'
});

// 获取聊天历史
socket.emit('get_chat_history', {
    roomId: 'general',
    limit: 50
});

// 标记消息已读
socket.emit('mark_message_read', {
    messageId: 'msg-123',
    roomId: 'general'
});
```

### REST API 端点

```bash
# 获取房间信息
curl http://localhost:3000/api/chat/rooms/general

# 获取聊天历史
curl http://localhost:3000/api/chat/rooms/general/messages?limit=20

# 搜索消息
curl "http://localhost:3000/api/chat/rooms/general/search?q=hello"
```

## 📋 功能清单

### 已实现功能

- ✅ 实时消息发送和接收
- ✅ 多房间聊天支持
- ✅ 消息历史记录
- ✅ 在线用户管理
- ✅ 输入状态指示
- ✅ 消息已读状态
- ✅ 消息搜索功能
- ✅ 消息删除
- ✅ 自动清理过期消息
- ✅ JWT 认证集成
- ✅ 完整的错误处理

### 预定义房间

- `general` - 通用聊天室
- `tech` - 技术讨论
- `random` - 随机聊天

## 🛠️ 开发配置

### 环境变量

创建 `.env` 文件（如果不存在）：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=freebackend
DB_USER=root
DB_PASS=password

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Socket.IO 配置
CHAT_MAX_MESSAGE_LENGTH=1000
CHAT_MESSAGE_RETENTION_DAYS=30
```

### 项目结构

```
src/
├── socket/
│   └── index.js          # Socket.IO 事件处理器
├── services/
│   └── chatService.js    # 聊天业务逻辑
├── controllers/
│   └── chatController.js # REST API 控制器
├── routes/
│   └── chat.js          # 聊天路由
└── utils/
    └── chatClient.js     # 测试客户端
```

## 🧪 测试方法

### 方法1：使用内置测试客户端

```javascript
// 运行测试
const { runChatTest } = require('./src/utils/chatClient');

// 基本测试
runChatTest();

// 自定义测试
runChatTest({
    serverUrl: 'http://localhost:3000',
    roomId: 'general',
    testUser: '测试用户',
    messageCount: 5
});
```

### 方法2：使用 curl 测试 REST API

```bash
# 测试健康检查
curl http://localhost:3000/health

# 测试聊天API
curl http://localhost:3000/api/chat/rooms/general

# 测试消息搜索
curl "http://localhost:3000/api/chat/rooms/general/search?q=test"
```

### 方法3：使用 Postman

1. 导入 Postman 集合（如果提供）
2. 设置环境变量：
   - `baseUrl`: `http://localhost:3000`
   - `token`: 有效的 JWT token
3. 测试各个端点

## 🔍 故障排除

### 常见问题

**Q: 连接失败**
A: 检查服务器是否启动，端口是否被占用

**Q: 认证失败**
A: 确认提供了有效的 JWT token

**Q: 消息发送失败**
A: 检查房间ID是否正确，消息内容是否为空

**Q: 无法接收消息**
A: 确认已正确加入房间，检查事件监听器

### 日志查看

```bash
# 查看实时日志
tail -f logs/combined.log

# 查看错误日志
tail -f logs/error.log

# 过滤聊天相关日志
tail -f logs/combined.log | grep -i chat
```

## 📚 详细文档

- [完整 API 文档](./docs/chat-api.md)
- [架构设计说明](./docs/architecture.md)
- [部署指南](./docs/deployment.md)

## 🎯 下一步

1. **集成前端**：将聊天功能集成到你的前端应用
2. **自定义功能**：根据需求扩展聊天功能
3. **性能优化**：根据使用情况调整配置参数
4. **安全加固**：配置生产环境的安全设置

## 💡 提示

- 开发环境下，可以使用简单的 token 进行测试
- 生产环境请务必使用强密码和安全的 JWT secret
- 定期备份重要聊天数据
- 监控系统性能和资源使用情况

---

如有问题，请查看详细文档或检查服务器日志。