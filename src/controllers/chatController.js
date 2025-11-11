const chatService = require('../services/chatService');

class ChatController {
  // 获取房间信息
  async getRoomInfo(req, res) {
    try {
      const { roomId } = req.params;
      
      if (!roomId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const roomInfo = await chatService.getRoomInfo(roomId);
      
      if (!roomInfo) {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        statusCode: 200,
        message: '获取房间信息成功',
        data: roomInfo,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取房间信息失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '获取房间信息失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 获取聊天历史（REST API版本）
  async getChatHistory(req, res) {
    try {
      const { roomId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      if (!roomId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const messages = await chatService.getChatHistory(roomId, parseInt(limit), parseInt(offset));
      
      res.status(200).json({
        statusCode: 200,
        message: '获取聊天历史成功',
        data: {
          roomId,
          messages,
          hasMore: messages.length === parseInt(limit)
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取聊天历史失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '获取聊天历史失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 搜索消息
  async searchMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { q: query, limit = 20 } = req.query;
      
      if (!roomId || !query) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID和搜索关键词不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const results = await chatService.searchMessages(roomId, query, parseInt(limit));
      
      res.status(200).json({
        statusCode: 200,
        message: '搜索消息成功',
        data: {
          roomId,
          query,
          results,
          total: results.length
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('搜索消息失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '搜索消息失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 删除消息
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user?.userId; // 从认证中间件获取
      const isAdmin = req.user?.role === 'admin'; // 检查管理员权限
      
      if (!messageId) {
        return res.status(400).json({
          statusCode: 400,
          message: '消息ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      if (!userId) {
        return res.status(401).json({
          statusCode: 401,
          message: '未授权访问',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      await chatService.deleteMessage(messageId, userId, isAdmin);
      
      res.status(200).json({
        statusCode: 200,
        message: '删除消息成功',
        data: { messageId },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('删除消息失败:', error);
      
      if (error.message === '消息不存在') {
        return res.status(404).json({
          statusCode: 404,
          message: '消息不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
      
      if (error.message === '无权删除此消息') {
        return res.status(403).json({
          statusCode: 403,
          message: '无权删除此消息',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '删除消息失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 获取聊天统计信息
  async getChatStats(req, res) {
    try {
      const stats = await chatService.getStats();
      
      res.status(200).json({
        statusCode: 200,
        message: '获取聊天统计成功',
        data: stats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取聊天统计失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '获取聊天统计失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 清理过期消息（管理员功能）
  async cleanupMessages(req, res) {
    try {
      const { hours = 24 } = req.query;
      const isAdmin = req.user?.role === 'admin'; // 检查管理员权限
      
      if (!isAdmin) {
        return res.status(403).json({
          statusCode: 403,
          message: '需要管理员权限',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const result = await chatService.cleanupExpiredMessages(parseInt(hours));
      
      res.status(200).json({
        statusCode: 200,
        message: '清理过期消息成功',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('清理过期消息失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '清理过期消息失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 创建新房间（如果需要动态房间创建）
  async createRoom(req, res) {
    try {
      const { roomId, roomName, description, roomType = 'public', maxUsers = 100 } = req.body;
      const userId = req.user?.userId;
      
      if (!roomId || !roomName) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID和名称不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 验证房间ID格式（只允许字母、数字、下划线和短横线）
      const roomIdRegex = /^[a-zA-Z0-9_-]+$/;
      if (!roomIdRegex.test(roomId)) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID只能包含字母、数字、下划线和短横线',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 验证房间名称长度
      if (roomName.length < 2 || roomName.length > 50) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间名称长度必须在2-50个字符之间',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 检查房间是否已存在
      const existingRoomInfo = await chatService.getRoomInfo(roomId);
      if (existingRoomInfo) {
        return res.status(409).json({
          statusCode: 409,
          message: '房间ID已存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 创建房间逻辑
      const roomData = {
        id: roomId,
        name: roomName,
        description: description || '',
        type: roomType,
        maxUsers: parseInt(maxUsers),
        createdBy: userId,
        createdAt: new Date(),
        memberCount: 0,
        isActive: true
      };

      // 调用服务层创建房间
      const createdRoom = await chatService.createRoom(roomData);
      
      // 创建系统欢迎消息
      const welcomeMessage = {
        roomId: roomId,
        senderId: 'system',
        senderName: '系统',
        content: `房间 "${roomName}" 已创建成功！欢迎加入聊天。`,
        type: 'system'
      };
      await chatService.createMessage(welcomeMessage);

      res.status(201).json({
        statusCode: 201,
        message: '房间创建成功',
        data: createdRoom,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('创建房间失败:', error);
      
      if (error.message === '房间已存在') {
        return res.status(409).json({
          statusCode: 409,
          message: '房间已存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '创建房间失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 获取所有房间列表
  async getAllRooms(req, res) {
    try {
      const { includeInactive = false } = req.query;
      const rooms = await chatService.getAllRooms(includeInactive === 'true');
      
      res.status(200).json({
        statusCode: 200,
        message: '获取房间列表成功',
        data: rooms,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取房间列表失败:', error);
      res.status(500).json({
        statusCode: 500,
        message: '获取房间列表失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 更新房间信息
  async updateRoom(req, res) {
    try {
      const { roomId } = req.params;
      const updates = req.body;
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === 'admin';
      
      if (!roomId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 检查权限（只有创建者或管理员可以更新房间）
      const roomInfo = await chatService.getRoomInfo(roomId);
      if (!roomInfo) {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      if (roomInfo.createdBy !== userId && !isAdmin) {
        return res.status(403).json({
          statusCode: 403,
          message: '无权更新此房间',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const updatedRoom = await chatService.updateRoom(roomId, updates);
      
      res.status(200).json({
        statusCode: 200,
        message: '更新房间成功',
        data: updatedRoom,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('更新房间失败:', error);
      
      if (error.message === '房间不存在') {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '更新房间失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 删除房间
  async deleteRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      const isAdmin = req.user?.role === 'admin';
      
      if (!roomId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      // 检查权限（只有创建者或管理员可以删除房间）
      const roomInfo = await chatService.getRoomInfo(roomId);
      if (!roomInfo) {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      if (roomInfo.createdBy !== userId && !isAdmin) {
        return res.status(403).json({
          statusCode: 403,
          message: '无权删除此房间',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      await chatService.deleteRoom(roomId);
      
      res.status(200).json({
        statusCode: 200,
        message: '删除房间成功',
        data: { roomId },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('删除房间失败:', error);
      
      if (error.message === '房间不存在') {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '删除房间失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 加入房间
  async joinRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      
      if (!roomId || !userId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID和用户ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const result = await chatService.joinRoom(roomId, userId);
      
      res.status(200).json({
        statusCode: 200,
        message: '加入房间成功',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('加入房间失败:', error);
      
      if (error.message === '房间不存在') {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }
      
      if (error.message === '房间已满') {
        return res.status(409).json({
          statusCode: 409,
          message: '房间已满，无法加入',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '加入房间失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 离开房间
  async leaveRoom(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user?.userId;
      
      if (!roomId || !userId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID和用户ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const result = await chatService.leaveRoom(roomId, userId);
      
      res.status(200).json({
        statusCode: 200,
        message: '离开房间成功',
        data: result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('离开房间失败:', error);
      
      if (error.message === '房间不存在') {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '离开房间失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }

  // 获取房间成员列表
  async getRoomMembers(req, res) {
    try {
      const { roomId } = req.params;
      
      if (!roomId) {
        return res.status(400).json({
          statusCode: 400,
          message: '房间ID不能为空',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      const members = await chatService.getRoomMembers(roomId);
      
      res.status(200).json({
        statusCode: 200,
        message: '获取房间成员成功',
        data: { roomId, members },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('获取房间成员失败:', error);
      
      if (error.message === '房间不存在') {
        return res.status(404).json({
          statusCode: 404,
          message: '房间不存在',
          data: null,
          timestamp: new Date().toISOString()
        });
      }

      res.status(500).json({
        statusCode: 500,
        message: '获取房间成员失败',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
  }
}

const chatController = new ChatController();

module.exports = {
  getRoomInfo: chatController.getRoomInfo,
  getChatHistory: chatController.getChatHistory,
  searchMessages: chatController.searchMessages,
  deleteMessage: chatController.deleteMessage,
  getChatStats: chatController.getChatStats,
  cleanupMessages: chatController.cleanupMessages,
  createRoom: chatController.createRoom,
  getAllRooms: chatController.getAllRooms,
  updateRoom: chatController.updateRoom,
  deleteRoom: chatController.deleteRoom,
  joinRoom: chatController.joinRoom,
  leaveRoom: chatController.leaveRoom,
  getRoomMembers: chatController.getRoomMembers
};