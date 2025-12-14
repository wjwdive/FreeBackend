const News = require('../models/News');
const ApiKey = require('../models/ApiKey');

/**
 * 新闻模块控制器
 * 处理新闻相关的API请求
 */
class NewsController {

  /**
   * 获取公开新闻列表（无需API密钥）
   * GET /api/public/news
   */
  static async getPublicNewsList(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        keyword
      } = req.query;

      // 验证参数
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: '分页参数无效',
          code: 'INVALID_PAGINATION'
        });
      }

      // 获取新闻列表
      const result = await News.getNewsList({
        page: pageNum,
        limit: limitNum,
        category,
        keyword
      });

      res.json({
        success: true,
        data: {
          news: result.news,
          pagination: result.pagination
        }
      });
      
    } catch (error) {
      console.error('获取公开新闻列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取公开新闻列表失败',
        code: 'GET_PUBLIC_NEWS_FAILED'
      });
    }
  }

  /**
   * 获取公开新闻详情（无需API密钥）
   * GET /api/public/news/:id
   */
  static async getPublicNewsDetail(req, res) {
    try {
      const newsId = parseInt(req.params.id);
      
      if (!newsId || newsId < 1) {
        return res.status(400).json({
          success: false,
          message: '新闻ID无效',
          code: 'INVALID_NEWS_ID'
        });
      }

      const news = await News.getNewsDetail(newsId);
      
      if (!news) {
        return res.status(404).json({
          success: false,
          message: '新闻不存在或已被删除',
          code: 'NEWS_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          news
        }
      });
      
    } catch (error) {
      console.error('获取公开新闻详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取公开新闻详情失败',
        code: 'GET_PUBLIC_NEWS_DETAIL_FAILED'
      });
    }
  }

  /**
   * 获取公开新闻分类列表（无需API密钥）
   * GET /api/public/news/categories
   */
  static async getPublicCategories(req, res) {
    try {
      const categories = [
        { value: 'technology', label: '科技', count: await News.count({ where: { category: 'technology', status: 'published' } }) },
        { value: 'sports', label: '体育', count: await News.count({ where: { category: 'sports', status: 'published' } }) },
        { value: 'entertainment', label: '娱乐', count: await News.count({ where: { category: 'entertainment', status: 'published' } }) },
        { value: 'politics', label: '政治', count: await News.count({ where: { category: 'politics', status: 'published' } }) },
        { value: 'business', label: '商业', count: await News.count({ where: { category: 'business', status: 'published' } }) }
      ];

      res.json({
        success: true,
        data: {
          categories
        }
      });
      
    } catch (error) {
      console.error('获取公开分类列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取公开分类列表失败',
        code: 'GET_PUBLIC_CATEGORIES_FAILED'
      });
    }
  }
  
  /**
   * 验证API密钥中间件
   */
  static async validateApiKey(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API密钥不能为空',
          code: 'MISSING_API_KEY'
        });
      }

      const keyInfo = await ApiKey.validateKey(apiKey);
      
      if (!keyInfo) {
        return res.status(401).json({
          success: false,
          message: 'API密钥无效或已过期',
          code: 'INVALID_API_KEY'
        });
      }

      // 将密钥信息添加到请求对象中
      req.apiKeyInfo = keyInfo;
      next();
      
    } catch (error) {
      console.error('API密钥验证失败:', error);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误',
        code: 'INTERNAL_ERROR'
      });
    }
  }

  /**
   * 获取新闻列表
   * GET /api/news
   */
  static async getNewsList(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        category,
        keyword
      } = req.query;

      // 验证参数
      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      
      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          message: '分页参数无效',
          code: 'INVALID_PAGINATION'
        });
      }

      // 获取新闻列表
      const result = await News.getNewsList({
        page: pageNum,
        limit: limitNum,
        category,
        keyword
      });

      res.json({
        success: true,
        data: {
          news: result.news,
          pagination: result.pagination,
          apiKeyInfo: {
            keyId: req.apiKeyInfo.keyId,
            name: req.apiKeyInfo.name,
            requestCount: req.apiKeyInfo.requestCount,
            requestLimit: req.apiKeyInfo.requestLimit
          }
        }
      });
      
    } catch (error) {
      console.error('获取新闻列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取新闻列表失败',
        code: 'GET_NEWS_FAILED'
      });
    }
  }

  /**
   * 获取新闻详情
   * GET /api/news/:id
   */
  static async getNewsDetail(req, res) {
    try {
      const newsId = parseInt(req.params.id);
      
      if (!newsId || newsId < 1) {
        return res.status(400).json({
          success: false,
          message: '新闻ID无效',
          code: 'INVALID_NEWS_ID'
        });
      }

      const news = await News.getNewsDetail(newsId);
      
      if (!news) {
        return res.status(404).json({
          success: false,
          message: '新闻不存在或已被删除',
          code: 'NEWS_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          news,
          apiKeyInfo: {
            keyId: req.apiKeyInfo.keyId,
            name: req.apiKeyInfo.name,
            requestCount: req.apiKeyInfo.requestCount,
            requestLimit: req.apiKeyInfo.requestLimit
          }
        }
      });
      
    } catch (error) {
      console.error('获取新闻详情失败:', error);
      res.status(500).json({
        success: false,
        message: '获取新闻详情失败',
        code: 'GET_NEWS_DETAIL_FAILED'
      });
    }
  }

  /**
   * 获取新闻分类列表
   * GET /api/news/categories
   */
  static async getCategories(req, res) {
    try {
      const categories = [
        { value: 'technology', label: '科技', count: await News.count({ where: { category: 'technology', status: 'published' } }) },
        { value: 'sports', label: '体育', count: await News.count({ where: { category: 'sports', status: 'published' } }) },
        { value: 'entertainment', label: '娱乐', count: await News.count({ where: { category: 'entertainment', status: 'published' } }) },
        { value: 'politics', label: '政治', count: await News.count({ where: { category: 'politics', status: 'published' } }) },
        { value: 'business', label: '商业', count: await News.count({ where: { category: 'business', status: 'published' } }) }
      ];

      res.json({
        success: true,
        data: {
          categories,
          apiKeyInfo: {
            keyId: req.apiKeyInfo.keyId,
            name: req.apiKeyInfo.name,
            requestCount: req.apiKeyInfo.requestCount,
            requestLimit: req.apiKeyInfo.requestLimit
          }
        }
      });
      
    } catch (error) {
      console.error('获取分类列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取分类列表失败',
        code: 'GET_CATEGORIES_FAILED'
      });
    }
  }
}

module.exports = NewsController;