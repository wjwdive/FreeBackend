const io = require('socket.io-client');

// 服务器地址
const SERVER_URL = 'http://localhost:3001';

// 模拟两个用户
const user1 = {
  userId: 'user001',
  username: '张三',
  token: 'token_user001'
};

const user2 = {
  userId: 'user002', 
  username: '李四',
  token: 'token_user002'
};

// 测试一对一聊天功能
async function testPrivateChat() {
  console.log('=== 开始测试一对一聊天功能 ===\n');

  // 创建两个用户的Socket连接
  const socket1 = io(SERVER_URL, {
    auth: {
      token: user1.token
    }
  });

  const socket2 = io(SERVER_URL, {
    auth: {
      token: user2.token
    }
  });

  // 设置事件监听器
  socket1.on('connect', () => {
    console.log(`✅ ${user1.username} 连接成功`);
  });

  socket2.on('connect', () => {
    console.log(`✅ ${user2.username} 连接成功`);
  });

  socket1.on('welcome', (data) => {
    console.log(`👋 ${user1.username} 收到欢迎消息: ${data.message}`);
  });

  socket2.on('welcome', (data) => {
    console.log(`👋 ${user2.username} 收到欢迎消息: ${data.message}`);
  });

  socket1.on('offline_messages_batch', (data) => {
    console.log(`📨 ${user1.username} 收到离线消息批次 ${data.batchIndex + 1}/${data.totalBatches}: ${data.messages.length} 条消息`);
  });

  socket2.on('offline_messages_batch', (data) => {
    console.log(`📨 ${user2.username} 收到离线消息批次 ${data.batchIndex + 1}/${data.totalBatches}: ${data.messages.length} 条消息`);
  });

  socket1.on('new_private_message', (data) => {
    console.log(`💬 ${user1.username} 收到来自 ${data.from.username} 的私聊消息: ${data.message.content}`);
    console.log(`   会话ID: ${data.conversation.id}`);
    console.log(`   消息ID: ${data.message.id}\n`);
  });

  socket2.on('new_private_message', (data) => {
    console.log(`💬 ${user2.username} 收到来自 ${data.from.username} 的私聊消息: ${data.message.content}`);
    console.log(`   会话ID: ${data.conversation.id}`);
    console.log(`   消息ID: ${data.message.id}\n`);
  });

  socket1.on('private_message_sent', (data) => {
    console.log(`✅ ${user1.username} 发送私聊消息成功`);
    console.log(`   消息ID: ${data.messageId}`);
    console.log(`   会话ID: ${data.conversationId}\n`);
  });

  socket2.on('private_message_sent', (data) => {
    console.log(`✅ ${user2.username} 发送私聊消息成功`);
    console.log(`   消息ID: ${data.messageId}`);
    console.log(`   会话ID: ${data.conversationId}\n`);
  });

  socket1.on('message_delivered', (data) => {
    console.log(`📮 ${user1.username} 收到消息送达回执: 消息 ${data.messageId} 已送达给用户 ${data.to}`);
  });

  socket2.on('message_delivered', (data) => {
    console.log(`📮 ${user2.username} 收到消息送达回执: 消息 ${data.messageId} 已送达给用户 ${data.to}`);
  });

  socket1.on('conversations_list', (data) => {
    console.log(`📋 ${user1.username} 收到会话列表: ${data.conversations.length} 个会话`);
    data.conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. 会话ID: ${conv.id}, 对方: ${conv.otherUser.username}`);
    });
    console.log('');
  });

  socket2.on('conversations_list', (data) => {
    console.log(`📋 ${user2.username} 收到会话列表: ${data.conversations.length} 个会话`);
    data.conversations.forEach((conv, index) => {
      console.log(`   ${index + 1}. 会话ID: ${conv.id}, 对方: ${conv.otherUser.username}`);
    });
    console.log('');
  });

  socket1.on('conversation_detail', (data) => {
    console.log(`📖 ${user1.username} 收到会话详情: ${data.conversation.id}`);
    console.log(`   参与者: ${data.participants.join(', ')}`);
    console.log(`   消息数量: ${data.messages.length}`);
    console.log('');
  });

  socket2.on('conversation_detail', (data) => {
    console.log(`📖 ${user2.username} 收到会话详情: ${data.conversation.id}`);
    console.log(`   参与者: ${data.participants.join(', ')}`);
    console.log(`   消息数量: ${data.messages.length}`);
    console.log('');
  });

  socket1.on('error', (data) => {
    console.error(`❌ ${user1.username} 发生错误: ${data.message}`);
  });

  socket2.on('error', (data) => {
    console.error(`❌ ${user2.username} 发生错误: ${data.message}`);
  });

  socket1.on('disconnect', () => {
    console.log(`🔌 ${user1.username} 断开连接`);
  });

  socket2.on('disconnect', () => {
    console.log(`🔌 ${user2.username} 断开连接`);
  });

  // 等待连接建立
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 测试1: 用户1发送消息给用户2
  console.log('=== 测试1: 用户1发送消息给用户2 ===');
  socket1.emit('send_private_message', {
    to: user2.userId,
    content: '你好，李四！这是一条测试消息。',
    type: 'text'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试2: 用户2回复用户1
  console.log('=== 测试2: 用户2回复用户1 ===');
  socket2.emit('send_private_message', {
    to: user1.userId,
    content: '你好，张三！收到你的消息了。',
    type: 'text'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试3: 获取会话列表
  console.log('=== 测试3: 获取会话列表 ===');
  socket1.emit('get_conversations');
  socket2.emit('get_conversations');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试4: 获取会话详情
  console.log('=== 测试4: 获取会话详情 ===');
  // 先获取会话列表，然后获取第一个会话的详情
  socket1.once('conversations_list', (data) => {
    if (data.conversations.length > 0) {
      const firstConversation = data.conversations[0];
      socket1.emit('get_conversation_detail', {
        conversationId: firstConversation.id
      });
    }
  });

  socket1.emit('get_conversations');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 测试5: 用户1发送离线消息（模拟用户2断开连接）
  console.log('=== 测试5: 测试离线消息功能 ===');
  socket2.disconnect();
  console.log(`🔌 ${user2.username} 断开连接，模拟离线状态`);

  await new Promise(resolve => setTimeout(resolve, 1000));

  // 用户1发送消息给离线的用户2
  socket1.emit('send_private_message', {
    to: user2.userId,
    content: '李四，你离线了，这条消息会存储为离线消息。',
    type: 'text'
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 用户2重新连接，应该收到离线消息
  console.log(`🔌 ${user2.username} 重新连接`);
  socket2.connect();

  await new Promise(resolve => setTimeout(resolve, 3000));

  // 测试6: 获取离线消息
  console.log('=== 测试6: 获取离线消息 ===');
  socket2.emit('get_offline_messages');

  await new Promise(resolve => setTimeout(resolve, 2000));

  // 测试完成，断开连接
  console.log('=== 测试完成 ===');
  socket1.disconnect();
  socket2.disconnect();

  console.log('\n✅ 一对一聊天功能测试完成！');
}

// 运行测试
testPrivateChat().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});