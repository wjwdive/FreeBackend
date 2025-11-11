const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const chatService = require('../services/chatService');

// 在线用户管理
const onlineUsers = new Map(); // socketId -> userInfo
const userRooms = new Map(); // userId -> roomIds

class SocketHandler {
  constructor(io) {
    this.io = io;
    console.log(`🚀 Socket.IO服务器初始化完成`);
    console.log(`📊 服务器配置信息:`, {
      cors: this.io.engine.opts.cors,
      transports: this.io.engine.opts.transports,
      pingTimeout: this.io.engine.opts.pingTimeout,
      pingInterval: this.io.engine.opts.pingInterval
    });
    this.setupConnectionHandlers();
  }

  setupConnectionHandlers() {
    this.io.use(this.authenticateSocket.bind(this));
    this.io.on('connection', this.handleConnection.bind(this));
  }

  // Socket.IO认证中间件
  async authenticateSocket(socket, next) {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('认证失败：缺少token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      socket.userId = decoded.userId;
      socket.username = decoded.username || '匿名用户';
      
      next();
    } catch (error) {
      console.error('Socket认证失败:', error.message);
      next(new Error('认证失败：无效的token'));
    }
  }

  // 处理连接
  async handleConnection(socket) {
    try {
      console.log(`✅ 用户 ${socket.username} (${socket.userId}) 已连接，Socket ID: ${socket.id}`);
      console.log(`📊 当前在线用户数量: ${onlineUsers.size + 1}`);

      // 添加用户到在线列表
      onlineUsers.set(socket.id, {
        userId: socket.userId,
        username: socket.username,
        socketId: socket.id,
        connectedAt: new Date()
      });

      // 发送在线用户列表
      this.broadcastOnlineUsers();

      // 推送离线消息
      await this.pushOfflineMessages(socket);

      // 注册事件处理器
      this.registerEventHandlers(socket);

      // 处理断开连接
      socket.on('disconnect', this.handleDisconnect.bind(this, socket));
      socket.on('error', this.handleError.bind(this, socket));
      
      console.log(`🔗 用户 ${socket.username} 连接处理完成，事件处理器已注册`);
    } catch (error) {
      console.error('❌ 处理连接失败:', error);
      socket.emit('error', { message: '连接处理失败' });
      socket.disconnect();
    }
  }

  // 注册事件处理器
  registerEventHandlers(socket) {
    // 加入聊天室
    socket.on('join_room', this.handleJoinRoom.bind(this, socket));
    
    // 离开聊天室
    socket.on('leave_room', this.handleLeaveRoom.bind(this, socket));
    
    // 发送消息（群聊）
    socket.on('send_message', this.handleSendMessage.bind(this, socket));
    
    // 发送私聊消息
    socket.on('send_private_message', this.handleSendPrivateMessage.bind(this, socket));
    
    // 获取聊天历史
    socket.on('get_chat_history', this.handleGetChatHistory.bind(this, socket));
    
    // 获取私聊会话列表
    socket.on('get_conversations', this.handleGetConversations.bind(this, socket));
    
    // 获取会话详情
    socket.on('get_conversation_detail', this.handleGetConversationDetail.bind(this, socket));
    
    // 获取在线用户
    socket.on('get_online_users', this.handleGetOnlineUsers.bind(this, socket));
    
    // 输入状态
    socket.on('typing_start', this.handleTypingStart.bind(this, socket));
    socket.on('typing_stop', this.handleTypingStop.bind(this, socket));
    
    // 消息已读
    socket.on('mark_message_read', this.handleMarkMessageRead.bind(this, socket));
    
    // 获取离线消息
    socket.on('get_offline_messages', this.handleGetOfflineMessages.bind(this, socket));
  }

  // 处理加入房间
  async handleJoinRoom(socket, data) {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        console.log(`❌ 用户 ${socket.username} 尝试加入房间失败：房间ID为空`);
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      // 检查用户是否已在房间中
      const userRoomsSet = userRooms.get(socket.userId);
      if (userRoomsSet && userRoomsSet.has(roomId)) {
        console.log(`ℹ️ 用户 ${socket.username} 已在房间 ${roomId} 中`);
        socket.emit('join_success', {
          roomId,
          message: '成功加入房间'
        });
        return;
      }

      // 获取加入前房间的客户端数量
      const roomBeforeJoin = this.io.sockets.adapter.rooms.get(roomId);
      const clientCountBefore = roomBeforeJoin ? roomBeforeJoin.size : 0;

      // 加入房间
      socket.join(roomId);
      
      // 更新用户房间映射
      if (!userRooms.has(socket.userId)) {
        userRooms.set(socket.userId, new Set());
      }
      userRooms.get(socket.userId).add(roomId);

      // 获取加入后房间的客户端数量
      const roomAfterJoin = this.io.sockets.adapter.rooms.get(roomId);
      const clientCountAfter = roomAfterJoin ? roomAfterJoin.size : 0;

      console.log(`✅ 用户 ${socket.username} 加入房间 ${roomId}`);
      console.log(`📊 房间 ${roomId} 客户端数量：${clientCountBefore} → ${clientCountAfter}`);
      
      // 通知房间内其他用户
      socket.to(roomId).emit('user_joined', {
        userId: socket.userId,
        username: socket.username,
        roomId,
        timestamp: new Date()
      });

      // 发送加入成功确认
      socket.emit('join_success', {
        roomId,
        message: '成功加入房间'
      });
      
      console.log(`🔔 已通知房间 ${roomId} 其他用户有新用户加入`);

    } catch (error) {
      console.error('❌ 加入房间失败:', error);
      socket.emit('error', { message: '加入房间失败' });
    }
  }

  // 处理离开房间
  async handleLeaveRoom(socket, data) {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        console.log(`❌ 用户 ${socket.username} 尝试离开房间失败：房间ID为空`);
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      // 检查用户是否在房间中
      const userRoomsSet = userRooms.get(socket.userId);
      if (!userRoomsSet || !userRoomsSet.has(roomId)) {
        console.log(`ℹ️ 用户 ${socket.username} 不在房间 ${roomId} 中，无需离开`);
        socket.emit('room_left', { roomId });
        return;
      }

      // 获取离开前房间的客户端数量
      const roomBeforeLeave = this.io.sockets.adapter.rooms.get(roomId);
      const clientCountBefore = roomBeforeLeave ? roomBeforeLeave.size : 0;

      // 离开房间
      socket.leave(roomId);
      
      // 从用户房间记录中移除
      if (userRooms.has(socket.userId)) {
        userRooms.get(socket.userId).delete(roomId);
        
        // 如果用户没有其他房间，删除记录
        if (userRooms.get(socket.userId).size === 0) {
          userRooms.delete(socket.userId);
          console.log(`🗑️ 用户 ${socket.username} 已离开所有房间，删除房间记录`);
        }
      }

      // 获取离开后房间的客户端数量
      const roomAfterLeave = this.io.sockets.adapter.rooms.get(roomId);
      const clientCountAfter = roomAfterLeave ? roomAfterLeave.size : 0;

      console.log(`🚪 用户 ${socket.username} 离开房间 ${roomId}`);
      console.log(`📊 房间 ${roomId} 客户端数量：${clientCountBefore} → ${clientCountAfter}`);

      // 通知房间内其他用户
      socket.to(roomId).emit('user_left', {
        userId: socket.userId,
        username: socket.username,
        roomId,
        timestamp: new Date()
      });

      // 发送成功确认
      socket.emit('room_left', { roomId });
      
      console.log(`🔔 已通知房间 ${roomId} 其他用户有用户离开`);

    } catch (error) {
      console.error('❌ 离开房间失败:', error);
      socket.emit('error', { message: '离开房间失败' });
    }
  }

  // 处理发送消息
  async handleSendMessage(socket, data) {
    try {
      const { roomId, content, type = 'text' } = data;
      
      if (!roomId || !content) {
        socket.emit('error', { message: '房间ID和消息内容不能为空' });
        return;
      }

      // 创建消息
      const message = await chatService.createMessage({
        id: uuidv4(),
        roomId,
        senderId: socket.userId,
        senderName: socket.username,
        content,
        type,
        timestamp: new Date()
      });

      // 获取房间中的客户端数量
      const clientCount = this.io.sockets.adapter.rooms.get(roomId)?.size || 0;
      
      console.log(`📤 用户 ${socket.username} 在房间 ${roomId} 发送消息: ${content.substring(0, 50)}...`);
      console.log(`📊 房间 ${roomId} 中的客户端数量: ${clientCount}`);
      
      // 广播消息到房间
      this.io.to(roomId).emit('new_message', message);

      // 发送成功确认
      socket.emit('message_sent', { messageId: message.id });
      
      console.log(`✅ 消息发送完成 - ID: ${message.id}, 房间: ${roomId}, 接收者数量: ${clientCount}`);

    } catch (error) {
      console.error('发送消息失败:', error);
      socket.emit('error', { message: '发送消息失败' });
    }
  }

  // 处理获取聊天历史
  async handleGetChatHistory(socket, data) {
    try {
      const { roomId, limit = 50, offset = 0 } = data;
      
      if (!roomId) {
        socket.emit('error', { message: '房间ID不能为空' });
        return;
      }

      const messages = await chatService.getChatHistory(roomId, limit, offset);
      
      socket.emit('chat_history', {
        roomId,
        messages,
        hasMore: messages.length === limit
      });

    } catch (error) {
      console.error('获取聊天历史失败:', error);
      socket.emit('error', { message: '获取聊天历史失败' });
    }
  }

  // 处理获取在线用户
  async handleGetOnlineUsers(socket) {
    try {
      const users = Array.from(onlineUsers.values()).map(user => ({
        userId: user.userId,
        username: user.username,
        connectedAt: user.connectedAt
      }));
      
      socket.emit('online_users', { users });

    } catch (error) {
      console.error('获取在线用户失败:', error);
      socket.emit('error', { message: '获取在线用户失败' });
    }
  }

  // 处理输入开始
  async handleTypingStart(socket, data) {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return;
      }

      socket.to(roomId).emit('user_typing', {
        userId: socket.userId,
        username: socket.username,
        roomId
      });

    } catch (error) {
      console.error('处理输入状态失败:', error);
    }
  }

  // 处理输入停止
  async handleTypingStop(socket, data) {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        return;
      }

      socket.to(roomId).emit('user_stop_typing', {
        userId: socket.userId,
        username: socket.username,
        roomId
      });

    } catch (error) {
      console.error('处理输入状态失败:', error);
    }
  }

  // 处理消息已读
  async handleMarkMessageRead(socket, data) {
    try {
      const { messageId, roomId } = data;
      
      if (!messageId || !roomId) {
        socket.emit('error', { message: '消息ID和房间ID不能为空' });
        return;
      }

      await chatService.markMessageRead(messageId, socket.userId);
      
      // 通知房间内其他用户消息已读
      socket.to(roomId).emit('message_read', {
        messageId,
        readerId: socket.userId,
        readerName: socket.username,
        timestamp: new Date()
      });

    } catch (error) {
      console.error('标记消息已读失败:', error);
      socket.emit('error', { message: '标记消息已读失败' });
    }
  }

  // 处理断开连接
  async handleDisconnect(socket) {
    try {
      console.log(`❌ 用户 ${socket.username} (${socket.userId}) 已断开连接，Socket ID: ${socket.id}`);
      console.log(`📊 断开前在线用户数量: ${onlineUsers.size}`);

      // 从在线用户列表中移除
      const userInfo = onlineUsers.get(socket.id);
      onlineUsers.delete(socket.id);
      
      // 从所有房间中移除用户
      if (userRooms.has(socket.userId)) {
        const rooms = userRooms.get(socket.userId);
        console.log(`🚪 用户 ${socket.username} 正在从 ${rooms.length} 个房间中移除`);
        
        rooms.forEach(roomId => {
          console.log(`🏠 从房间 ${roomId} 移除用户 ${socket.username}`);
          socket.to(roomId).emit('user_left', {
            userId: socket.userId,
            username: socket.username,
            roomId,
            timestamp: new Date()
          });
        });
        userRooms.delete(socket.userId);
      }

      // 广播更新后的在线用户列表
      this.broadcastOnlineUsers();
      
      console.log(`✅ 用户 ${socket.username} 断开连接处理完成`);
      console.log(`📊 断开后在线用户数量: ${onlineUsers.size}`);

    } catch (error) {
      console.error('❌ 处理断开连接失败:', error);
    }
  }

  // 处理错误
  async handleError(socket, error) {
    console.error(`❌ Socket错误 (用户: ${socket.username}, Socket ID: ${socket.id}):`, error);
    console.error(`📋 错误详情:`, {
      userId: socket.userId,
      username: socket.username,
      socketId: socket.id,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString()
    });
    socket.emit('error', { 
      message: '发生内部错误',
      timestamp: new Date().toISOString()
    });
  }

  // ========== 一对一聊天事件处理 ==========

  // 处理发送私聊消息
  async handleSendPrivateMessage(socket, data) {
    try {
      const { to, content, type = 'text' } = data;
      
      if (!to || !content) {
        socket.emit('error', { message: '接收者和消息内容不能为空' });
        return;
      }

      // 发送私聊消息
      const result = await chatService.sendPrivateMessage(
        socket.userId, 
        to, 
        content, 
        type
      );

      const { message, conversation } = result;

      console.log(`用户 ${socket.username} 发送私聊消息给用户 ${to}: ${content.substring(0, 50)}...`);

      // 查找接收者是否在线
      const receiverSocket = this.findUserSocket(to);
      
      if (receiverSocket) {
        // 接收者在线，直接发送消息
        receiverSocket.emit('new_private_message', {
          message,
          conversation,
          from: {
            userId: socket.userId,
            username: socket.username
          }
        });

        // 发送送达回执
        socket.emit('message_delivered', {
          messageId: message.id,
          to,
          timestamp: new Date()
        });
      } else {
        // 接收者离线，存储离线消息
        await chatService.storeOfflineMessage(to, message.id);
        
        console.log(`用户 ${to} 离线，消息已存储`);
      }

      // 发送成功确认
      socket.emit('private_message_sent', { 
        messageId: message.id,
        conversationId: conversation.id
      });

    } catch (error) {
      console.error('发送私聊消息失败:', error);
      socket.emit('error', { message: '发送私聊消息失败' });
    }
  }

  // 处理获取会话列表
  async handleGetConversations(socket) {
    try {
      const conversations = await chatService.getUserConversations(socket.userId);
      
      // 为每个会话添加对方用户信息
      const conversationsWithDetails = await Promise.all(
        conversations.map(async (conversation) => {
          const otherUserId = chatService.getOtherParticipant(conversation.id, socket.userId);
          return {
            ...conversation,
            otherUser: {
              userId: otherUserId,
              username: `用户${otherUserId}` // 实际应该从数据库获取
            }
          };
        })
      );

      socket.emit('conversations_list', {
        conversations: conversationsWithDetails
      });

    } catch (error) {
      console.error('获取会话列表失败:', error);
      socket.emit('error', { message: '获取会话列表失败' });
    }
  }

  // 处理获取会话详情
  async handleGetConversationDetail(socket, data) {
    try {
      const { conversationId } = data;
      
      if (!conversationId) {
        socket.emit('error', { message: '会话ID不能为空' });
        return;
      }

      // 检查用户是否有权限访问此会话
      if (!chatService.isUserInConversation(socket.userId, conversationId)) {
        socket.emit('error', { message: '无权访问此会话' });
        return;
      }

      const conversationDetail = await chatService.getConversationDetail(conversationId);
      
      if (!conversationDetail) {
        socket.emit('error', { message: '会话不存在' });
        return;
      }

      socket.emit('conversation_detail', conversationDetail);

    } catch (error) {
      console.error('获取会话详情失败:', error);
      socket.emit('error', { message: '获取会话详情失败' });
    }
  }

  // 处理获取离线消息
  async handleGetOfflineMessages(socket) {
    try {
      const offlineMessages = await chatService.getOfflineMessages(socket.userId);
      
      if (offlineMessages.length > 0) {
        socket.emit('offline_messages', {
          messages: offlineMessages,
          count: offlineMessages.length
        });
        
        console.log(`向用户 ${socket.username} 推送 ${offlineMessages.length} 条离线消息`);
      }

    } catch (error) {
      console.error('获取离线消息失败:', error);
      socket.emit('error', { message: '获取离线消息失败' });
    }
  }

  // 查找用户的Socket连接
  findUserSocket(userId) {
    for (const [socketId, userInfo] of onlineUsers.entries()) {
      if (userInfo.userId === userId) {
        return this.io.sockets.sockets.get(socketId);
      }
    }
    return null;
  }

  // 用户连接时推送离线消息
  async pushOfflineMessages(socket) {
    try {
      const offlineMessages = await chatService.getOfflineMessages(socket.userId);
      
      if (offlineMessages.length > 0) {
        // 分批发送离线消息，避免一次性发送过多
        const batchSize = 10;
        for (let i = 0; i < offlineMessages.length; i += batchSize) {
          const batch = offlineMessages.slice(i, i + batchSize);
          
          setTimeout(() => {
            socket.emit('offline_messages_batch', {
              messages: batch,
              batchIndex: Math.floor(i / batchSize),
              totalBatches: Math.ceil(offlineMessages.length / batchSize)
            });
          }, i * 100); // 每批间隔100ms
        }
        
        console.log(`向用户 ${socket.username} 推送 ${offlineMessages.length} 条离线消息`);
      }
    } catch (error) {
      console.error('推送离线消息失败:', error);
    }
  }

  // 广播在线用户列表
  broadcastOnlineUsers() {
    const users = Array.from(onlineUsers.values()).map(user => ({
      userId: user.userId,
      username: user.username,
      connectedAt: user.connectedAt
    }));
    
    this.io.emit('online_users_updated', { users });
  }

  // 获取在线用户统计
  getOnlineStats() {
    return {
      totalOnline: onlineUsers.size,
      users: Array.from(onlineUsers.values())
    };
  }

  // 服务器关闭时的清理操作
  cleanup() {
    console.log(`🛑 Socket.IO服务器正在关闭，开始清理资源...`);
    console.log(`📊 清理前统计: 在线用户 ${onlineUsers.size} 个，用户房间记录 ${userRooms.size} 个`);
    
    // 通知所有在线用户服务器即将关闭
    this.io.emit('server_shutdown', {
      message: '服务器即将关闭',
      timestamp: new Date().toISOString()
    });

    // 清理在线用户列表
    const onlineUserCount = onlineUsers.size;
    onlineUsers.clear();
    
    // 清理用户房间记录
    const userRoomCount = userRooms.size;
    userRooms.clear();

    console.log(`✅ 清理完成: 已清理 ${onlineUserCount} 个在线用户，${userRoomCount} 个房间记录`);
    console.log(`📊 清理后统计: 在线用户 ${onlineUsers.size} 个，用户房间记录 ${userRooms.size} 个`);
  }

  // 获取服务器状态信息
  getServerStatus() {
    const rooms = this.io.sockets.adapter.rooms;
    const roomCount = rooms.size;
    const socketCount = this.io.engine.clientsCount;
    
    return {
      serverStatus: 'running',
      socketCount,
      onlineUsers: onlineUsers.size,
      roomCount,
      userRooms: userRooms.size,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = (io) => new SocketHandler(io);