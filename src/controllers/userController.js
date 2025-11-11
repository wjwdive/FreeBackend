const userService = require('../services/userService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateQuery, validateParams } = require('../middleware/validation');

/**
 * 用户控制器类
 * 处理用户管理相关的HTTP请求
 */
class UserController {
  /**
   * 获取用户列表（分页）
   * GET /api/users
   */
  getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = 'desc', search = '' } = req.query;
    
    const result = await userService.getUserList({
      page: parseInt(page),
      limit: parseInt(limit),
      sort,
      search
    });
    
    res.status(200).json({
      statusCode: 200,
      message: '用户列表获取成功',
      data: {
        users: result.users,
        pagination: result.pagination
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 获取当前用户信息
   * GET /api/users/profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(req.user.userId);
    
    res.status(200).json({
      statusCode: 200,
      message: '用户信息获取成功',
      data: { user },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 根据ID获取用户信息
   * GET /api/users/:id
   */
  getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(parseInt(req.params.id));
    
    res.status(200).json({
      statusCode: 200,
      message: '用户信息获取成功',
      data: { user },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 更新用户信息
   * PUT /api/users/profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateUser(req.user.userId, req.body);
    
    res.status(200).json({
      statusCode: 200,
      message: '用户信息更新成功',
      data: { user: updatedUser },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 更新指定用户信息（管理员权限）
   * PUT /api/users/:id
   */
  updateUser = asyncHandler(async (req, res) => {
    const updatedUser = await userService.updateUser(parseInt(req.params.id), req.body);
    
    res.status(200).json({
      statusCode: 200,
      message: '用户信息更新成功',
      data: { user: updatedUser },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 删除用户（软删除）
   * DELETE /api/users/:id
   */
  deleteUser = asyncHandler(async (req, res) => {
    const result = await userService.deleteUser(parseInt(req.params.id));
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 批量更新用户状态
   * PUT /api/users/batch/status
   */
  batchUpdateUserStatus = asyncHandler(async (req, res) => {
    const { userIds, status } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        statusCode: 400,
        message: '用户ID列表不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    if (!status || !['active', 'inactive', 'banned'].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        message: '无效的用户状态',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const result = await userService.batchUpdateUserStatus(userIds, status);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: { updatedCount: result.updatedCount },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 获取用户统计信息
   * GET /api/users/statistics
   */
  getUserStatistics = asyncHandler(async (req, res) => {
    const result = await userService.getUserStatistics();
    
    res.status(200).json({
      statusCode: 200,
      message: '用户统计信息获取成功',
      data: result,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 搜索用户
   * GET /api/users/search
   * POST /api/users/search
   */
  searchUsers = asyncHandler(async (req, res) => {
    // 支持GET和POST两种请求方式
    const method = req.method;
    const params = method === 'POST' ? req.body : req.query;
    
    // 支持多种参数名：q/keyword, type/searchType
    // 处理嵌套参数结构
    let keyword = params.q || params.keyword;
    let searchType = params.type || params.searchType || 'all';
    const limit = params.limit || 20;
    
    // 如果keyword是对象，提取其中的keyword和searchType
    if (keyword && typeof keyword === 'object') {
      searchType = keyword.searchType || searchType;
      keyword = keyword.keyword || keyword.q || '';
    }
    
    console.log('搜索参数接收:', { method, params, keyword, searchType, limit });
    
    // 如果关键词为空或无效，则查询所有用户
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      console.log('搜索关键词为空，查询所有用户');
      const allUsers = await userService.getUserList({ 
        limit: parseInt(limit),
        sort: 'desc' 
      });
      
      return res.status(200).json({
        statusCode: 200,
        message: '查询所有用户成功',
        data: { 
          users: allUsers.users,
          searchInfo: {
            keyword: '',
            type: 'all',
            total: allUsers.pagination.total,
            limit: parseInt(limit),
            method
          }
        },
        timestamp: new Date().toISOString()
      });
    }

    // 关键词长度检查（至少1个字符）
    if (keyword.trim().length < 1) {
      return res.status(400).json({
        statusCode: 400,
        message: '搜索关键词至少需要1个字符',
        data: null,
        timestamp: new Date().toISOString()
      });
    }
    
    // 如果关键词只有1个字符，提供更友好的提示
    if (keyword.trim().length === 1) {
      console.log('搜索关键词只有1个字符，执行搜索但可能结果较多');
    }

    const users = await userService.searchUsers(keyword, parseInt(limit), searchType);
    
    res.status(200).json({
      statusCode: 200,
      message: '用户搜索成功',
      data: { 
        users,
        searchInfo: {
          keyword,
          type: searchType,
          total: users.length,
          limit: parseInt(limit),
          method
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 高级搜索用户
   * GET /api/users/advanced-search
   */
  advancedSearchUsers = asyncHandler(async (req, res) => {
    const { keyword, role, status, limit = 20 } = req.query;
    
    const searchParams = {
      keyword,
      role,
      status,
      limit: parseInt(limit)
    };

    const users = await userService.advancedSearchUsers(searchParams);
    
    res.status(200).json({
      statusCode: 200,
      message: '高级搜索成功',
      data: { 
        users,
        searchInfo: {
          keyword,
          role,
          status,
          total: users.length,
          limit: parseInt(limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 获取搜索建议
   * GET /api/users/search-suggestions
   */
  getSearchSuggestions = asyncHandler(async (req, res) => {
    const { q: keyword, limit = 10 } = req.query;
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim().length === 0) {
      return res.status(200).json({
        statusCode: 200,
        message: '搜索建议获取成功',
        data: { suggestions: [] },
        timestamp: new Date().toISOString()
      });
    }

    const suggestions = await userService.getSearchSuggestions(keyword, parseInt(limit));
    
    res.status(200).json({
      statusCode: 200,
      message: '搜索建议获取成功',
      data: { 
        suggestions,
        searchInfo: {
          keyword,
          total: suggestions.length,
          limit: parseInt(limit)
        }
      },
      timestamp: new Date().toISOString()
    });
  });
}

const userController = new UserController();

// 导出验证中间件
const validatePagination = validateQuery(require('../middleware/validation').schemas.pagination);
const validateUserId = validateParams(require('joi').object({
  id: require('joi').number().integer().min(1).required()
}));

module.exports = {
  getUsers: userController.getUsers,
  getProfile: userController.getProfile,
  getUserById: userController.getUserById,
  updateProfile: userController.updateProfile,
  updateUser: userController.updateUser,
  deleteUser: userController.deleteUser,
  batchUpdateUserStatus: userController.batchUpdateUserStatus,
  getUserStatistics: userController.getUserStatistics,
  searchUsers: userController.searchUsers,
  advancedSearchUsers: userController.advancedSearchUsers,
  getSearchSuggestions: userController.getSearchSuggestions,
  validatePagination,
  validateUserId
};