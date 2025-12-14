const express = require('express');
const router = express.Router();
const NewsController = require('../controllers/newsController');

/**
 * @swagger
 * components:
 *   schemas:
 *     News:
 *       type: object
 *       properties:
 *         newsId:
 *           type: integer
 *           description: 新闻ID
 *         title:
 *           type: string
 *           description: 新闻标题
 *         content:
 *           type: string
 *           description: 新闻内容
 *         category:
 *           type: string
 *           enum: [technology, sports, entertainment, politics, business]
 *           description: 新闻分类
 *         author:
 *           type: string
 *           description: 作者
 *         source:
 *           type: string
 *           description: 新闻来源
 *         publishDate:
 *           type: string
 *           format: date-time
 *           description: 发布时间
 *         status:
 *           type: string
 *           enum: [published, draft, archived]
 *           description: 新闻状态
 *         viewCount:
 *           type: integer
 *           description: 浏览次数
 *         tags:
 *           type: string
 *           description: 标签（逗号分隔）
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 创建时间
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新时间
 * 
 *     ApiKeyInfo:
 *       type: object
 *       properties:
 *         keyId:
 *           type: integer
 *           description: 密钥ID
 *         name:
 *           type: string
 *           description: 密钥名称
 *         requestCount:
 *           type: integer
 *           description: 今日请求次数
 *         requestLimit:
 *           type: integer
 *           description: 每日请求限制
 * 
 *     NewsListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             news:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/News'
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
 *             apiKeyInfo:
 *               $ref: '#/components/schemas/ApiKeyInfo'
 * 
 *   parameters:
 *     ApiKeyHeader:
 *       in: header
 *       name: x-api-key
 *       schema:
 *         type: string
 *       required: true
 *       description: API密钥
 *     ApiKeyQuery:
 *       in: query
 *       name: apiKey
 *       schema:
 *         type: string
 *       description: API密钥（查询参数方式）
 *     PageQuery:
 *       in: query
 *       name: page
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *       description: 页码
 *     LimitQuery:
 *       in: query
 *       name: limit
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 100
 *         default: 10
 *       description: 每页数量
 *     CategoryQuery:
 *       in: query
 *       name: category
 *       schema:
 *         type: string
 *         enum: [technology, sports, entertainment, politics, business]
 *       description: 新闻分类筛选
 *     KeywordQuery:
 *       in: query
 *       name: keyword
 *       schema:
 *         type: string
 *       description: 关键词搜索
 * 
 *   responses:
 *     Unauthorized:
 *       description: API密钥验证失败
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *               code:
 *                 type: string
 */

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: 获取新闻列表
 *     description: 获取分页的新闻列表，支持分类筛选和关键词搜索
 *     tags: [News]
 *     parameters:
 *       - $ref: '#/components/parameters/ApiKeyHeader'
 *       - $ref: '#/components/parameters/ApiKeyQuery'
 *       - $ref: '#/components/parameters/PageQuery'
 *       - $ref: '#/components/parameters/LimitQuery'
 *       - $ref: '#/components/parameters/CategoryQuery'
 *       - $ref: '#/components/parameters/KeywordQuery'
 *     responses:
 *       200:
 *         description: 成功获取新闻列表
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NewsListResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: 服务器内部错误
 */
router.get('/', NewsController.validateApiKey, NewsController.getNewsList);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: 获取新闻详情
 *     description: 根据新闻ID获取新闻详情
 *     tags: [News]
 *     parameters:
 *       - $ref: '#/components/parameters/ApiKeyHeader'
 *       - $ref: '#/components/parameters/ApiKeyQuery'
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: 新闻ID
 *     responses:
 *       200:
 *         description: 成功获取新闻详情
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     news:
 *                       $ref: '#/components/schemas/News'
 *                     apiKeyInfo:
 *                       $ref: '#/components/schemas/ApiKeyInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: 新闻不存在
 *       500:
 *         description: 服务器内部错误
 */
router.get('/:id', NewsController.validateApiKey, NewsController.getNewsDetail);

/**
 * @swagger
 * /api/news/categories:
 *   get:
 *     summary: 获取新闻分类列表
 *     description: 获取所有新闻分类及其对应的新闻数量
 *     tags: [News]
 *     parameters:
 *       - $ref: '#/components/parameters/ApiKeyHeader'
 *       - $ref: '#/components/parameters/ApiKeyQuery'
 *     responses:
 *       200:
 *         description: 成功获取分类列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     apiKeyInfo:
 *                       $ref: '#/components/schemas/ApiKeyInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         description: 服务器内部错误
 */
router.get('/categories', NewsController.validateApiKey, NewsController.getCategories);

module.exports = router;