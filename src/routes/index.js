const express = require('express');
const authRoutes = require('./auth');
const userRoutes = require('./users');
const toolsRoutes = require('./tools');
const chatRoutes = require('./chat');
const avatarRoutes = require('./avatarRoutes');
const newsRoutes = require('./news');
const apiKeyRoutes = require('./apikeys');
const newsPublicRoutes = require('./news-public');

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

// 头像路由
router.use('/avatars', avatarRoutes);

// 新闻API路由
router.use('/news', newsRoutes);

// API密钥管理路由
router.use('/apikeys', apiKeyRoutes);

// 公开新闻API路由（无需任何验证）
router.use('/public/news', newsPublicRoutes);

module.exports = router;