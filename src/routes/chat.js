const express = require('express');
const router = express.Router();
const {
  getRoomInfo,
  getChatHistory,
  searchMessages,
  deleteMessage,
  getChatStats,
  cleanupMessages,
  createRoom,
  getAllRooms,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  getRoomMembers
} = require('../controllers/chatController');
const { authenticateToken, authorize, optionalAuth } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: 聊天功能API
 */

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   get:
 *     summary: 获取房间信息
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *     responses:
 *       200:
 *         description: 获取房间信息成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取房间信息成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                     messageCount:
 *                       type: integer
 *                     lastMessage:
 *                       type: object
 *                     createdAt:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID不能为空
 *       404:
 *         description: 房间不存在
 */
router.get('/rooms/:roomId', getRoomInfo);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/messages:
 *   get:
 *     summary: 获取聊天历史
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: 每页消息数量
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: 偏移量
 *     responses:
 *       200:
 *         description: 获取聊天历史成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取聊天历史成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                     hasMore:
 *                       type: boolean
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID不能为空
 */
router.get('/rooms/:roomId/messages', getChatHistory);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/search:
 *   get:
 *     summary: 搜索消息
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: 搜索关键词
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: 返回结果数量
 *     responses:
 *       200:
 *         description: 搜索消息成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 搜索消息成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                     query:
 *                       type: string
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                     total:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID和搜索关键词不能为空
 */
router.get('/rooms/:roomId/search', searchMessages);

/**
 * @swagger
 * /api/chat/stats:
 *   get:
 *     summary: 获取聊天统计信息
 *     tags: [Chat]
 *     responses:
 *       200:
 *         description: 获取聊天统计成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取聊天统计成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalMessages:
 *                       type: integer
 *                     totalRooms:
 *                       type: integer
 *                     todayMessages:
 *                       type: integer
 *                     storageSize:
 *                       type: object
 *                 timestamp:
 *                   type: string
 */
router.get('/stats', getChatStats);

/**
 * @swagger
 * /api/chat/rooms:
 *   post:
 *     summary: 创建新房间
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - roomName
 *             properties:
 *               roomId:
 *                 type: string
 *                 description: 房间ID
 *               roomName:
 *                 type: string
 *                 description: 房间名称
 *               description:
 *                 type: string
 *                 description: 房间描述
 *     responses:
 *       200:
 *         description: 房间创建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 房间创建成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                     roomName:
 *                       type: string
 *                     description:
 *                       type: string
 *                     createdBy:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID和名称不能为空
 *       401:
 *         description: 未授权访问
 */
router.post('/rooms', authenticateToken, createRoom);

/**
 * @swagger
 * /api/chat/messages/{messageId}:
 *   delete:
 *     summary: 删除消息
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: 消息ID
 *     responses:
 *       200:
 *         description: 删除消息成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 删除消息成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 消息ID不能为空
 *       401:
 *         description: 未授权访问
 *       403:
 *         description: 无权删除此消息
 *       404:
 *         description: 消息不存在
 */
router.delete('/messages/:messageId', authenticateToken, deleteMessage);

/**
 * @swagger
 * /api/chat/cleanup:
 *   post:
 *     summary: 清理过期消息（管理员功能）
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: 清理多少小时前的消息
 *     responses:
 *       200:
 *         description: 清理过期消息成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 清理过期消息成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *       403:
 *         description: 需要管理员权限
 */
/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: 获取所有房间列表
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *           default: false
 *         description: 是否包含非活跃房间
 *     responses:
 *       200:
 *         description: 获取房间列表成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取房间列表成功
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 timestamp:
 *                   type: string
 */
router.get('/rooms', getAllRooms);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   put:
 *     summary: 更新房间信息
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 房间名称
 *               description:
 *                 type: string
 *                 description: 房间描述
 *               maxUsers:
 *                 type: integer
 *                 description: 最大用户数
 *               isActive:
 *                 type: boolean
 *                 description: 是否活跃
 *     responses:
 *       200:
 *         description: 更新房间成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 更新房间成功
 *                 data:
 *                   type: object
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID不能为空
 *       401:
 *         description: 未授权访问
 *       403:
 *         description: 无权更新此房间
 *       404:
 *         description: 房间不存在
 */
router.put('/rooms/:roomId', authenticateToken, updateRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   delete:
 *     summary: 删除房间
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *     responses:
 *       200:
 *         description: 删除房间成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 删除房间成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID不能为空
 *       401:
 *         description: 未授权访问
 *       403:
 *         description: 无权删除此房间
 *       404:
 *         description: 房间不存在
 */
router.delete('/rooms/:roomId', authenticateToken, deleteRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/join:
 *   post:
 *     summary: 加入房间
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *     responses:
 *       200:
 *         description: 加入房间成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 加入房间成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     memberCount:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID和用户ID不能为空
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 房间不存在
 *       409:
 *         description: 房间已满，无法加入
 */
router.post('/rooms/:roomId/join', authenticateToken, joinRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/leave:
 *   post:
 *     summary: 离开房间
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *     responses:
 *       200:
 *         description: 离开房间成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 离开房间成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     memberCount:
 *                       type: integer
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID和用户ID不能为空
 *       401:
 *         description: 未授权访问
 *       404:
 *         description: 房间不存在
 */
router.post('/rooms/:roomId/leave', authenticateToken, leaveRoom);

/**
 * @swagger
 * /api/chat/rooms/{roomId}/members:
 *   get:
 *     summary: 获取房间成员列表
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: 房间ID
 *     responses:
 *       200:
 *         description: 获取房间成员成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: 获取房间成员成功
 *                 data:
 *                   type: object
 *                   properties:
 *                     roomId:
 *                       type: string
 *                     members:
 *                       type: array
 *                       items:
 *                         type: string
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: 房间ID不能为空
 *       404:
 *         description: 房间不存在
 */
router.get('/rooms/:roomId/members', getRoomMembers);

router.post('/cleanup', authenticateToken, cleanupMessages);

module.exports = router;