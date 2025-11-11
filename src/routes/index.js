const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const toolsRoutes = require('./tools');
const chatRoutes = require('./chat');

const router = express.Router();

/**
 * 路由配置
 * 组织所有API路由
 */

// 认证路由
router.use('/auth', authRoutes);

// 用户路由
router.use('/users', userRoutes);

// 工具路由
router.use('/tools', toolsRoutes);

// 聊天路由
router.use('/chat', chatRoutes);

module.exports = router;