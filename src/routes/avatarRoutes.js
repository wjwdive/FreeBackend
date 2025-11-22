const express = require('express');
const router = express.Router();
const avatarController = require('../controllers/avatarController');

/**
 * @swagger
 * tags:
 *   name: Avatars
 *   description: 用户头像管理API
 */

/**
 * @swagger
 * /api/avatars:
 *   get:
 *     summary: 获取所有可用头像列表
 *     tags: [Avatars]
 *     responses:
 *       200:
 *         description: 头像列表获取成功
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
 *                   example: "头像列表获取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     default:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           filename:
 *                             type: string
 *                             example: "avatar1.jpg"
 *                           url:
 *                             type: string
 *                             example: "/avatars/default/avatar1.jpg"
 *                           category:
 *                             type: string
 *                             example: "default"
 *                     male:
 *                       type: array
 *                       items:
 *                         type: object
 *                     female:
 *                       type: array
 *                       items:
 *                         type: object
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 */
router.get('/', avatarController.getAvatars);

/**
 * @swagger
 * /api/avatars/random:
 *   get:
 *     summary: 获取随机默认头像
 *     tags: [Avatars]
 *     responses:
 *       200:
 *         description: 随机头像获取成功
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
 *                   example: "随机头像获取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       example: "/avatars/default/avatar1.jpg"
 *                     fullUrl:
 *                       type: string
 *                       example: "http://localhost:3000/avatars/default/avatar1.jpg"
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 */
router.get('/random', avatarController.getRandomAvatar);

/**
 * @swagger
 * /api/avatars/random/{gender}:
 *   get:
 *     summary: 根据性别获取随机头像
 *     tags: [Avatars]
 *     parameters:
 *       - in: path
 *         name: gender
 *         required: true
 *         schema:
 *           type: string
 *           enum: [male, female]
 *         description: 性别
 *     responses:
 *       200:
 *         description: 随机头像获取成功
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
 *                   example: "male性别随机头像获取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       example: "/avatars/male/user1.jpg"
 *                     fullUrl:
 *                       type: string
 *                       example: "http://localhost:3000/avatars/male/user1.jpg"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 无效的性别参数
 */
router.get('/random/:gender', avatarController.getRandomAvatarByGender);

/**
 * @swagger
 * /api/avatars/check:
 *   get:
 *     summary: 检查头像是否存在
 *     tags: [Avatars]
 *     parameters:
 *       - in: query
 *         name: avatarUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: 头像URL路径
 *     responses:
 *       200:
 *         description: 检查结果
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
 *                   example: "头像文件存在"
 *                 data:
 *                   type: object
 *                   properties:
 *                     exists:
 *                       type: boolean
 *                       example: true
 *                     avatarUrl:
 *                       type: string
 *                       example: "/avatars/default/avatar1.jpg"
 *                     info:
 *                       type: object
 *                       properties:
 *                         filename:
 *                           type: string
 *                         path:
 *                           type: string
 *                         size:
 *                           type: integer
 *                         modified:
 *                           type: string
 *                         url:
 *                           type: string
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 缺少参数
 */
router.get('/check', avatarController.checkAvatarExists);

/**
 * @swagger
 * /api/avatars/info:
 *   get:
 *     summary: 获取头像文件信息
 *     tags: [Avatars]
 *     parameters:
 *       - in: query
 *         name: avatarUrl
 *         required: true
 *         schema:
 *           type: string
 *         description: 头像URL路径
 *     responses:
 *       200:
 *         description: 头像文件信息
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
 *                   example: "头像文件信息获取成功"
 *                 data:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                     path:
 *                       type: string
 *                     size:
 *                       type: integer
 *                     modified:
 *                       type: string
 *                     url:
 *                       type: string
 *                 timestamp:
 *                   type: string
 *                   example: "2024-01-01T00:00:00.000Z"
 *       400:
 *         description: 缺少参数
 *       404:
 *         description: 头像文件不存在
 */
router.get('/info', avatarController.getAvatarInfo);

module.exports = router;