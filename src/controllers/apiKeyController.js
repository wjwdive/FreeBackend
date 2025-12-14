const ApiKey = require('../models/ApiKey');

/**
 * API密钥管理控制器
 * 处理API密钥的生成、管理和验证
 */
class ApiKeyController {
  
  /**
   * 生成新的API密钥
   * POST /api/apikeys/generate
   */
  static async generateApiKey(req, res) {
    try {
      const { name, description, days = 30, requestLimit = 1000 } = req.body;

      // 验证参数
      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: '密钥名称不能为空',
          code: 'MISSING_NAME'
        });
      }

      if (days < 1 || days > 365) {
        return res.status(400).json({
          success: false,
          message: '有效天数必须在1-365之间',
          code: 'INVALID_DAYS'
        });
      }

      if (requestLimit < 1 || requestLimit > 100000) {
        return res.status(400).json({
          success: false,
          message: '请求限制必须在1-100000之间',
          code: 'INVALID_REQUEST_LIMIT'
        });
      }

      // 生成API密钥
      const keyInfo = await ApiKey.generateKey({
        name: name.trim(),
        description: description ? description.trim() : '',
        days: parseInt(days),
        requestLimit: parseInt(requestLimit)
      });

      res.status(201).json({
        success: true,
        message: 'API密钥生成成功',
        data: keyInfo
      });
      
    } catch (error) {
      console.error('生成API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: '生成API密钥失败',
        code: 'GENERATE_KEY_FAILED'
      });
    }
  }

  /**
   * 验证API密钥
   * GET /api/apikeys/validate
   */
  static async validateApiKey(req, res) {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(400).json({
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

      res.json({
        success: true,
        message: 'API密钥验证成功',
        data: keyInfo
      });
      
    } catch (error) {
      console.error('验证API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: '验证API密钥失败',
        code: 'VALIDATE_KEY_FAILED'
      });
    }
  }

  /**
   * 获取API密钥列表
   * GET /api/apikeys
   */
  static async getApiKeyList(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;

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

      const result = await ApiKey.getKeyList({
        page: pageNum,
        limit: limitNum
      });

      res.json({
        success: true,
        data: result
      });
      
    } catch (error) {
      console.error('获取API密钥列表失败:', error);
      res.status(500).json({
        success: false,
        message: '获取API密钥列表失败',
        code: 'GET_KEY_LIST_FAILED'
      });
    }
  }

  /**
   * 禁用API密钥
   * DELETE /api/apikeys/:id
   */
  static async disableApiKey(req, res) {
    try {
      const keyId = parseInt(req.params.id);
      
      if (!keyId || keyId < 1) {
        return res.status(400).json({
          success: false,
          message: '密钥ID无效',
          code: 'INVALID_KEY_ID'
        });
      }

      const success = await ApiKey.disableKey(keyId);
      
      if (!success) {
        return res.status(404).json({
          success: false,
          message: '密钥不存在',
          code: 'KEY_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'API密钥已禁用'
      });
      
    } catch (error) {
      console.error('禁用API密钥失败:', error);
      res.status(500).json({
        success: false,
        message: '禁用API密钥失败',
        code: 'DISABLE_KEY_FAILED'
      });
    }
  }

  /**
   * 获取API使用统计
   * GET /api/apikeys/stats
   */
  static async getApiStats(req, res) {
    try {
      const totalKeys = await ApiKey.count();
      const activeKeys = await ApiKey.count({ where: { status: 'active' } });
      const expiredKeys = await ApiKey.count({ where: { status: 'expired' } });
      const inactiveKeys = await ApiKey.count({ where: { status: 'inactive' } });

      // 获取今日活跃密钥
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayActiveKeys = await ApiKey.count({
        where: {
          status: 'active',
          lastRequestAt: {
            [require('sequelize').Op.gte]: today
          }
        }
      });

      res.json({
        success: true,
        data: {
          totalKeys,
          activeKeys,
          expiredKeys,
          inactiveKeys,
          todayActiveKeys,
          statsDate: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('获取API统计失败:', error);
      res.status(500).json({
        success: false,
        message: '获取API统计失败',
        code: 'GET_STATS_FAILED'
      });
    }
  }
}

module.exports = ApiKeyController;