const { v4: uuidv4 } = require('uuid');

// 内存存储（生产环境应该使用数据库）
const messages = new Map(); // messageId -> message
const roomMessages = new Map(); // roomId -> messageIds[]
const messageReadStatus = new Map(); // messageId -> Set(userIds)
const rooms = new Map(); // roomId -> roomInfo
const roomMembers = new Map(); // roomId -> Set(userIds)

// 一对一聊天会话管理
const privateConversations = new Map(); // conversationId -> conversationInfo
const userConversations = new Map(); // userId -> Set(conversationIds)
const offlineMessages = new Map(); // userId -> messageIds[]

class ChatService {
  constructor() {
    // 初始化一些示例数据
    this.initializeSampleData();
  }

  // 初始化示例数据
  initializeSampleData() {
    // 创建示例房间
    const sampleRooms = [
      {
        id: 'general',
        name: '公共聊天室',
        description: '欢迎来到公共聊天室，大家可以在这里自由交流',
        type: 'public',
        maxUsers: 500,
        createdBy: 'system'
      },
      {
        id: 'tech',
        name: '技术讨论',
        description: '技术爱好者的聚集地，讨论编程、开发等技术话题',
        type: 'public',
        maxUsers: 200,
        createdBy: 'system'
      },
      {
        id: 'random',
        name: '闲聊区',
        description: '轻松愉快的闲聊空间，分享生活中的点滴',
        type: 'public',
        maxUsers: 300,
        createdBy: 'system'
      }
    ];

    // 创建示例房间
    sampleRooms.forEach(roomData => {
      try {
        this.createRoom(roomData);
      } catch (error) {
        // 如果房间已存在，忽略错误
        if (error.message !== '房间已存在') {
          console.error('初始化房间失败:', error);
        }
      }
    });

    // 创建示例消息
    const sampleMessages = [
      {
        id: uuidv4(),
        roomId: 'general',
        senderId: 'system',
        senderName: '系统',
        content: '欢迎来到聊天室！',
        type: 'system',
        timestamp: new Date('2024-01-01T00:00:00Z')
      },
      {
        id: uuidv4(),
        roomId: 'general',
        senderId: 'system',
        senderName: '系统',
        content: '请遵守聊天室规则，文明交流。',
        type: 'system',
        timestamp: new Date('2024-01-01T00:00:01Z')
      }
    ];

    sampleMessages.forEach(message => {
      this.createMessage(message);
    });
  }

  // 创建消息
  async createMessage(messageData) {
    const message = {
      id: messageData.id || uuidv4(),
      roomId: messageData.roomId,
      senderId: messageData.senderId,
      senderName: messageData.senderName,
      content: messageData.content,
      type: messageData.type || 'text',
      timestamp: messageData.timestamp || new Date(),
      readBy: new Set()
    };

    // 存储消息
    messages.set(message.id, message);

    // 添加到房间消息列表
    if (!roomMessages.has(message.roomId)) {
      roomMessages.set(message.roomId, []);
    }
    roomMessages.get(message.roomId).push(message.id);

    // 初始化已读状态
    messageReadStatus.set(message.id, new Set());

    console.log(`创建消息: ${message.id} 在房间 ${message.roomId}`);
    
    return message;
  }

  // 获取聊天历史
  async getChatHistory(roomId, limit = 50, offset = 0) {
    if (!roomMessages.has(roomId)) {
      return [];
    }

    const messageIds = roomMessages.get(roomId);
    const startIndex = Math.max(0, messageIds.length - offset - limit);
    const endIndex = messageIds.length - offset;
    const paginatedIds = messageIds.slice(startIndex, endIndex).reverse();

    const history = paginatedIds.map(id => {
      const message = messages.get(id);
      if (!message) return null;

      return {
        ...message,
        readBy: Array.from(messageReadStatus.get(id) || [])
      };
    }).filter(Boolean);

    return history;
  }

  // 标记消息已读
  async markMessageRead(messageId, userId) {
    if (!messages.has(messageId)) {
      throw new Error('消息不存在');
    }

    if (!messageReadStatus.has(messageId)) {
      messageReadStatus.set(messageId, new Set());
    }

    messageReadStatus.get(messageId).add(userId);
    
    console.log(`用户 ${userId} 标记消息 ${messageId} 为已读`);
    
    return { success: true };
  }

  // 获取房间信息
  async getRoomInfo(roomId) {
    if (!roomMessages.has(roomId)) {
      return null;
    }

    const messageIds = roomMessages.get(roomId);
    const messageCount = messageIds.length;
    
    // 获取最后一条消息
    const lastMessageId = messageIds[messageIds.length - 1];
    const lastMessage = messages.get(lastMessageId);

    return {
      roomId,
      messageCount,
      lastMessage: lastMessage ? {
        id: lastMessage.id,
        content: lastMessage.content,
        senderName: lastMessage.senderName,
        timestamp: lastMessage.timestamp
      } : null,
      createdAt: new Date() // 实际应该从数据库获取
    };
  }

  // 搜索消息
  async searchMessages(roomId, query, limit = 20) {
    if (!roomMessages.has(roomId)) {
      return [];
    }

    const messageIds = roomMessages.get(roomId);
    const results = [];

    for (const messageId of messageIds) {
      const message = messages.get(messageId);
      if (message && message.content.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          ...message,
          readBy: Array.from(messageReadStatus.get(messageId) || [])
        });
        
        if (results.length >= limit) {
          break;
        }
      }
    }

    return results.reverse();
  }

  // 删除消息（仅限发送者或管理员）
  async deleteMessage(messageId, userId, isAdmin = false) {
    if (!messages.has(messageId)) {
      throw new Error('消息不存在');
    }

    const message = messages.get(messageId);
    
    // 检查权限
    if (message.senderId !== userId && !isAdmin) {
      throw new Error('无权删除此消息');
    }

    // 从消息存储中删除
    messages.delete(messageId);
    
    // 从房间消息列表中删除
    if (roomMessages.has(message.roomId)) {
      const roomMessageIds = roomMessages.get(message.roomId);
      const index = roomMessageIds.indexOf(messageId);
      if (index > -1) {
        roomMessageIds.splice(index, 1);
      }
    }

    // 删除已读状态
    messageReadStatus.delete(messageId);

    console.log(`删除消息: ${messageId}`);
    
    return { success: true };
  }

  // 获取统计信息
  async getStats() {
    const totalMessages = messages.size;
    const totalRooms = roomMessages.size;
    
    // 计算今日消息数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayMessages = Array.from(messages.values()).filter(
      message => message.timestamp >= today
    ).length;

    return {
      totalMessages,
      totalRooms,
      todayMessages,
      storageSize: this.getStorageSize()
    };
  }

  // 获取存储大小（估算）
  getStorageSize() {
    let size = 0;
    
    // 计算消息存储大小
    messages.forEach((message, id) => {
      size += id.length;
      size += JSON.stringify(message).length;
    });

    // 计算房间消息索引大小
    roomMessages.forEach((messageIds, roomId) => {
      size += roomId.length;
      size += JSON.stringify(messageIds).length;
    });

    // 计算已读状态大小
    messageReadStatus.forEach((userIds, messageId) => {
      size += messageId.length;
      size += JSON.stringify(Array.from(userIds)).length;
    });

    return {
      bytes: size,
      kilobytes: Math.round(size / 1024 * 100) / 100,
      megabytes: Math.round(size / 1024 / 1024 * 100) / 100
    };
  }

  // 清理过期消息（示例：清理24小时前的消息）
  async cleanupExpiredMessages(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const [messageId, message] of messages.entries()) {
      if (message.timestamp < cutoffTime) {
        // 删除消息
        messages.delete(messageId);
        
        // 从房间消息列表中删除
        if (roomMessages.has(message.roomId)) {
          const roomMessageIds = roomMessages.get(message.roomId);
          const index = roomMessageIds.indexOf(messageId);
          if (index > -1) {
            roomMessageIds.splice(index, 1);
          }
        }

        // 删除已读状态
        messageReadStatus.delete(messageId);
        
        deletedCount++;
      }
    }

    console.log(`清理了 ${deletedCount} 条过期消息`);
    return { deletedCount };
  }

  // 创建新房间
  async createRoom(roomData) {
    const { id, name, description, type, maxUsers, createdBy } = roomData;
    
    // 检查房间是否已存在
    if (rooms.has(id)) {
      throw new Error('房间已存在');
    }

    // 创建房间信息
    const room = {
      id,
      name,
      description: description || '',
      type: type || 'public',
      maxUsers: maxUsers || 100,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      memberCount: 0,
      isActive: true,
      messageCount: 0
    };

    // 存储房间信息
    rooms.set(id, room);
    
    // 初始化房间消息列表
    roomMessages.set(id, []);
    
    // 初始化房间成员列表
    roomMembers.set(id, new Set());

    console.log(`创建房间: ${id} (${name})`);
    
    return room;
  }

  // 获取房间信息
  async getRoomInfo(roomId) {
    if (!rooms.has(roomId)) {
      return null;
    }

    const room = rooms.get(roomId);
    
    // 获取房间消息数量
    const messageIds = roomMessages.get(roomId) || [];
    room.messageCount = messageIds.length;
    
    // 获取房间成员数量
    const members = roomMembers.get(roomId) || new Set();
    room.memberCount = members.size;
    
    // 获取最后一条消息
    const lastMessageId = messageIds[messageIds.length - 1];
    const lastMessage = messages.get(lastMessageId);
    room.lastMessage = lastMessage ? {
      id: lastMessage.id,
      content: lastMessage.content,
      senderName: lastMessage.senderName,
      timestamp: lastMessage.timestamp
    } : null;

    return room;
  }

  // 获取所有房间列表
  async getAllRooms(includeInactive = false) {
    const roomList = [];
    
    for (const [roomId, room] of rooms.entries()) {
      if (!includeInactive && !room.isActive) {
        continue;
      }
      
      const roomInfo = await this.getRoomInfo(roomId);
      if (roomInfo) {
        roomList.push(roomInfo);
      }
    }

    // 按活跃度排序（成员数 + 消息数）
    roomList.sort((a, b) => {
      const scoreA = a.memberCount * 10 + a.messageCount;
      const scoreB = b.memberCount * 10 + b.messageCount;
      return scoreB - scoreA;
    });

    return roomList;
  }

  // 更新房间信息
  async updateRoom(roomId, updates) {
    if (!rooms.has(roomId)) {
      throw new Error('房间不存在');
    }

    const room = rooms.get(roomId);
    
    // 允许更新的字段
    const allowedUpdates = ['name', 'description', 'maxUsers', 'isActive'];
    let hasUpdates = false;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key) && room[key] !== value) {
        room[key] = value;
        hasUpdates = true;
      }
    }

    if (hasUpdates) {
      room.updatedAt = new Date();
      rooms.set(roomId, room);
      console.log(`更新房间: ${roomId}`);
    }

    return room;
  }

  // 删除房间（管理员功能）
  async deleteRoom(roomId) {
    if (!rooms.has(roomId)) {
      throw new Error('房间不存在');
    }

    // 删除房间信息
    rooms.delete(roomId);
    
    // 删除房间消息列表
    roomMessages.delete(roomId);
    
    // 删除房间成员列表
    roomMembers.delete(roomId);

    console.log(`删除房间: ${roomId}`);
    
    return { success: true };
  }

  // 加入房间
  async joinRoom(roomId, userId) {
    if (!rooms.has(roomId)) {
      throw new Error('房间不存在');
    }

    const room = rooms.get(roomId);
    
    // 检查房间是否已满
    const members = roomMembers.get(roomId);
    if (members.size >= room.maxUsers) {
      throw new Error('房间已满');
    }

    // 添加用户到房间
    members.add(userId);
    room.memberCount = members.size;
    room.updatedAt = new Date();

    console.log(`用户 ${userId} 加入房间: ${roomId}`);
    
    return { success: true, memberCount: room.memberCount };
  }

  // 离开房间
  async leaveRoom(roomId, userId) {
    if (!rooms.has(roomId)) {
      throw new Error('房间不存在');
    }

    const room = rooms.get(roomId);
    const members = roomMembers.get(roomId);
    
    // 从房间移除用户
    members.delete(userId);
    room.memberCount = members.size;
    room.updatedAt = new Date();

    console.log(`用户 ${userId} 离开房间: ${roomId}`);
    
    return { success: true, memberCount: room.memberCount };
  }

  // 获取房间成员列表
  async getRoomMembers(roomId) {
    if (!rooms.has(roomId)) {
      throw new Error('房间不存在');
    }

    const members = roomMembers.get(roomId);
    return Array.from(members);
  }

  // ========== 一对一聊天功能 ==========

  /**
   * 生成会话ID（按字母顺序排序两个用户ID然后拼接）
   */
  generateConversationId(userId1, userId2) {
    const sortedIds = [userId1, userId2].sort();
    return `conversation_${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * 获取或创建一对一聊天会话
   */
  async getOrCreateConversation(userId1, userId2) {
    const conversationId = this.generateConversationId(userId1, userId2);
    
    // 如果会话已存在，直接返回
    if (privateConversations.has(conversationId)) {
      return privateConversations.get(conversationId);
    }

    // 创建新会话
    const conversation = {
      id: conversationId,
      type: 'private',
      participants: [userId1, userId2],
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null
    };

    privateConversations.set(conversationId, conversation);

    // 更新用户会话映射
    [userId1, userId2].forEach(userId => {
      if (!userConversations.has(userId)) {
        userConversations.set(userId, new Set());
      }
      userConversations.get(userId).add(conversationId);
    });

    console.log(`创建新会话: ${conversationId}`);
    return conversation;
  }

  /**
   * 发送一对一消息
   */
  async sendPrivateMessage(senderId, receiverId, content, messageType = 'text') {
    try {
      // 获取或创建会话
      const conversation = await this.getOrCreateConversation(senderId, receiverId);
      
      // 创建消息
      const message = await this.createMessage({
        roomId: conversation.id, // 使用会话ID作为房间ID
        senderId,
        senderName: `用户${senderId}`, // 实际应该从数据库获取用户名
        content,
        type: messageType,
        timestamp: new Date()
      });

      // 更新会话的最后消息
      conversation.lastMessage = {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        timestamp: message.timestamp
      };
      conversation.updatedAt = new Date();

      return {
        message,
        conversation
      };
    } catch (error) {
      console.error('发送私聊消息失败:', error);
      throw error;
    }
  }

  /**
   * 获取用户的所有会话列表
   */
  async getUserConversations(userId) {
    if (!userConversations.has(userId)) {
      return [];
    }

    const conversationIds = Array.from(userConversations.get(userId));
    const conversations = [];

    for (const conversationId of conversationIds) {
      const conversation = privateConversations.get(conversationId);
      if (conversation) {
        conversations.push(conversation);
      }
    }

    // 按最后更新时间排序
    return conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * 获取会话详情
   */
  async getConversationDetail(conversationId) {
    const conversation = privateConversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    // 获取会话消息历史
    const messages = await this.getChatHistory(conversationId, 50);
    
    return {
      ...conversation,
      messages
    };
  }

  /**
   * 存储离线消息
   */
  async storeOfflineMessage(receiverId, messageId) {
    if (!offlineMessages.has(receiverId)) {
      offlineMessages.set(receiverId, []);
    }
    offlineMessages.get(receiverId).push(messageId);
  }

  /**
   * 获取用户的离线消息
   */
  async getOfflineMessages(userId) {
    if (!offlineMessages.has(userId)) {
      return [];
    }

    const messageIds = offlineMessages.get(userId);
    const messages = [];

    for (const messageId of messageIds) {
      const message = this.messages.get(messageId);
      if (message) {
        messages.push({
          ...message,
          readBy: Array.from(this.messageReadStatus.get(messageId) || [])
        });
      }
    }

    // 清空离线消息
    offlineMessages.delete(userId);

    return messages;
  }

  /**
   * 获取会话的对方用户ID
   */
  getOtherParticipant(conversationId, currentUserId) {
    const conversation = privateConversations.get(conversationId);
    if (!conversation) {
      return null;
    }

    return conversation.participants.find(id => id !== currentUserId);
  }

  /**
   * 检查用户是否在会话中
   */
  isUserInConversation(userId, conversationId) {
    const conversation = privateConversations.get(conversationId);
    if (!conversation) {
      return false;
    }

    return conversation.participants.includes(userId);
  }
}

module.exports = new ChatService();