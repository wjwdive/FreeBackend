/**
 * 聊天客户端测试工具
 * 用于测试Socket.IO聊天功能
 */

const io = require('socket.io-client');

class ChatClient {
  constructor(serverUrl, token) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
    this.username = null;
  }

  // 连接服务器
  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io(this.serverUrl, {
        auth: {
          token: this.token
        }
      });

      this.socket.on('connect', () => {
        console.log('✅ 连接服务器成功');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('❌ 连接服务器失败:', error.message);
        reject(error);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('🔌 连接断开:', reason);
        this.isConnected = false;
      });

      this.socket.on('error', (error) => {
        console.error('❌ Socket错误:', error);
      });

      // 注册事件监听器
      this.registerEventListeners();
    });
  }

  // 注册事件监听器
  registerEventListeners() {
    // 新消息事件
    this.socket.on('new_message', (message) => {
      console.log(`💬 [${message.roomId}] ${message.senderName}: ${message.content}`);
    });

    // 用户加入事件
    this.socket.on('user_joined', (data) => {
      console.log(`👋 [${data.roomId}] ${data.username} 加入了房间`);
    });

    // 用户离开事件
    this.socket.on('user_left', (data) => {
      console.log(`👋 [${data.roomId}] ${data.username} 离开了房间`);
    });

    // 用户输入事件
    this.socket.on('user_typing', (data) => {
      console.log(`⌨️  [${data.roomId}] ${data.username} 正在输入...`);
    });

    this.socket.on('user_stop_typing', (data) => {
      console.log(`⌨️  [${data.roomId}] ${data.username} 停止输入`);
    });

    // 消息已读事件
    this.socket.on('message_read', (data) => {
      console.log(`📖 [${data.messageId}] ${data.readerName} 已读消息`);
    });

    // 在线用户更新事件
    this.socket.on('online_users_updated', (data) => {
      console.log(`👥 在线用户更新: ${data.users.length} 人在线`);
    });

    // 加入成功事件
    this.socket.on('join_success', (data) => {
      console.log(`✅ 成功加入房间: ${data.roomId}`);
    });

    // 消息发送成功事件
    this.socket.on('message_sent', (data) => {
      console.log(`✅ 消息发送成功: ${data.messageId}`);
    });

    // 聊天历史事件
    this.socket.on('chat_history', (data) => {
      console.log(`📜 房间 ${data.roomId} 的聊天历史: ${data.messages.length} 条消息`);
    });

    // 在线用户列表事件
    this.socket.on('online_users', (data) => {
      console.log(`👥 当前在线用户: ${data.users.map(u => u.username).join(', ')}`);
    });
  }

  // 加入房间
  joinRoom(roomId) {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('join_room', { roomId });
    console.log(`🚪 请求加入房间: ${roomId}`);
  }

  // 离开房间
  leaveRoom(roomId) {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('leave_room', { roomId });
    console.log(`🚪 请求离开房间: ${roomId}`);
  }

  // 发送消息
  sendMessage(roomId, content, type = 'text') {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('send_message', { roomId, content, type });
    console.log(`📤 发送消息到房间 ${roomId}: ${content}`);
  }

  // 获取聊天历史
  getChatHistory(roomId, limit = 50, offset = 0) {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('get_chat_history', { roomId, limit, offset });
    console.log(`📜 请求房间 ${roomId} 的聊天历史`);
  }

  // 获取在线用户
  getOnlineUsers() {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('get_online_users');
    console.log(`👥 请求在线用户列表`);
  }

  // 开始输入
  startTyping(roomId) {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('typing_start', { roomId });
    console.log(`⌨️  通知房间 ${roomId} 开始输入`);
  }

  // 停止输入
  stopTyping(roomId) {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('typing_stop', { roomId });
    console.log(`⌨️  通知房间 ${roomId} 停止输入`);
  }

  // 标记消息已读
  markMessageRead(messageId, roomId) {
    if (!this.isConnected) {
      console.error('❌ 请先连接服务器');
      return;
    }

    this.socket.emit('mark_message_read', { messageId, roomId });
    console.log(`📖 标记消息 ${messageId} 为已读`);
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      console.log('🔌 断开服务器连接');
    }
  }

  // 获取连接状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      serverUrl: this.serverUrl,
      userId: this.userId,
      username: this.username
    };
  }
}

/**
 * 创建测试客户端实例
 */
function createTestClient(token = 'test-token') {
  const serverUrl = 'http://localhost:3000';
  return new ChatClient(serverUrl, token);
}

/**
 * 运行聊天功能测试
 */
async function runChatTest() {
  console.log('🚀 开始聊天功能测试...\n');

  // 创建客户端实例
  const client = createTestClient('test-user-token');

  try {
    // 连接服务器
    await client.connect();
    
    // 等待连接建立
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 测试加入房间
    client.joinRoom('general');
    
    // 等待加入房间
    await new Promise(resolve => setTimeout(resolve, 500));

    // 测试发送消息
    client.sendMessage('general', '大家好！这是一个测试消息。');
    
    // 测试输入状态
    client.startTyping('general');
    await new Promise(resolve => setTimeout(resolve, 2000));
    client.stopTyping('general');

    // 测试获取聊天历史
    client.getChatHistory('general');

    // 测试获取在线用户
    client.getOnlineUsers();

    // 等待一段时间观察事件
    console.log('\n⏳ 等待事件处理...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 测试离开房间
    client.leaveRoom('general');

    // 等待离开房间
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 断开连接
    client.disconnect();

    console.log('\n✅ 聊天功能测试完成');

  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

module.exports = {
  ChatClient,
  createTestClient,
  runChatTest
};