const express = require('express');
const router = express.Router();
const ApiKeyController = require('../controllers/apiKeyController');

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiKey:
 *       type: object
 *       properties:
 *         keyId:
 *           type: integer
 *           description: 密钥ID
 *         apiKey:
 *           type: string
 *           description: API密钥（仅在生成时返回）
 *         name:
 *           type: string
 *           description: 密钥名称
 *         description:
 *           type: string
 *           description: 密钥描述
 *         status:
 *           type: string
 *           enum: [active, inactive, expired]
 *           description: 密钥状态
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: 过期时间
 *         requestLimit:
 *           type: integer
 *           description: 每日请求限制
 *         requestCount:
 *           type: integer
 *           description: 今日请求计数
 *         lastRequestAt:
 *           type: string
 *           format: date-time
 *           description: 最后请求时间
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 * 
 *     GenerateApiKeyRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           description: 密钥名称
 *         description:
 *           type: string
 *           description: 密钥描述
 *         days:
 *           type: integer
 *           minimum: 1
 *           maximum: 365
 *           default: 30
 *           description: 有效天数
 *         requestLimit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100000
 *           default: 1000
 *           description: 每日请求限制
 * 
 *     ApiKeyListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             keys:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ApiKey'
 *             pagination:
 *               type: object
 *               properties:
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *                 pages:
 *                   type: integer
 * 
 *     ApiKeyStats:
 *       type: object
 *       properties:
 *         totalKeys:
 *           type: integer
 *           description: 总密钥数量
 *         activeKeys:
 *           type: integer
 *           description: 活跃密钥数量
 *         expiredKeys:
 *           type: integer
 *           description: 过期密钥数量
 *         inactiveKeys:
 *           type: integer
 *           description: 禁用密钥数量
 *         todayActiveKeys:
 *           type: integer
 *           description: 今日活跃密钥数量
 *         statsDate:
 *           type: string
 *           format: date-time
 *           description: 统计时间
 */

/**
 * @swagger
 * /api/apikeys/generate:
 *   post:
 *     summary: 生成新的API密钥
 *     description: 生成一个新的API密钥，用于访问新闻API
 *     tags: [API Keys]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateApiKeyRequest'
 *     responses:
 *       201:
 *         description: 成功生成API密钥
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/ApiKey'
 *       400:
 *         description: 请求参数无效
 *       500:
 *         description: 服务器内部错误
 */
router.post('/generate', ApiKeyController.generateApiKey);

/**
 * @swagger
 * /api/apikeys/validate:
 *   get:
 *     summary: 验证API密钥
 *     description: 验证API密钥的有效性
 *     tags: [API Keys]
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         schema:
 *           type: string
 *         required: true
 *         description: API密钥
 *       - in: query
 *         name: apiKey
 *         schema:
 *           type: string
 *         description: API密钥（查询参数方式）
 *     responses:
 *       200:
 *         description: API密钥验证成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     keyId:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     requestCount:
 *                       type: integer
 *                     requestLimit:
 *                       type: integer
 *       400:
 *         description: API密钥不能为空
 *       401:
 *         description: API密钥无效或已过期
 *       500:
 *         description: 服务器内部错误
 */
router.get('/validate', ApiKeyController.validateApiKey);

/**
 * @swagger
 * /api/apikeys:
 *   get:
 *     summary: 获取API密钥列表
 *     description: 获取所有API密钥的列表（不包含实际的API密钥）
 *     tags: [API Keys]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: 每页数量
 *     responses:
 *       200:
 *         description: 成功获取密钥列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiKeyListResponse'
 *       400:
 *         description: 分页参数无效
 *       500:
 *         description: 服务器内部错误
 */
router.get('/', ApiKeyController.getApiKeyList);

/**
 * @swagger
 * /api/apikeys/{id}:
 *   delete:
 *     summary: 禁用API密钥
 *     description: 禁用指定的API密钥
 *     tags: [API Keys]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 密钥ID
 *     responses:
 *       200:
 *         description: 成功禁用API密钥
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: 密钥ID无效
 *       404:
 *         description: 密钥不存在
 *       500:
 *         description: 服务器内部错误
 */
router.delete('/:id', ApiKeyController.disableApiKey);

/**
 * @swagger
 * /api/apikeys/stats:
 *   get:
 *     summary: 获取API使用统计
 *     description: 获取API密钥的使用统计信息
 *     tags: [API Keys]
 *     responses:
 *       200:
 *         description: 成功获取统计信息
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ApiKeyStats'
 *       500:
 *         description: 服务器内部错误
 */
router.get('/stats', ApiKeyController.getApiStats);

module.exports = router;