const express = require('express');
const {
  getUsers,
  getProfile,
  getUserById,
  updateProfile,
  updateUser,
  deleteUser,
  batchUpdateUserStatus,
  getUserStatistics,
  searchUsers,
  advancedSearchUsers,
  getSearchSuggestions,
  validatePagination,
  validateUserId
} = require('../controllers/userController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

// 所有用户路由都需要认证
router.use(authenticateToken);

/**
 * @route GET /api/users
 * @description 获取用户列表（分页）
 * @access Private
 */
router.get('/', validatePagination, getUsers);

/**
 * @route GET /api/users/profile
 * @description 获取当前用户信息
 * @access Private
 */
router.get('/profile', getProfile);

/**
 * @route GET /api/users/search
 * @description 搜索用户（支持模糊查询）
 * @query {string} q - 搜索关键词
 * @query {number} [limit=20] - 返回结果数量限制
 * @query {string} [type=all] - 搜索类型：all（全部字段）、username（仅用户名）、email（仅邮箱）
 * @access Private
 */
router.post('/search', searchUsers);

/**
 * @route GET /api/users/advanced-search
 * @description 高级搜索用户（支持多条件组合）
 * @query {string} [keyword] - 搜索关键词
 * @query {string} [role] - 角色过滤
 * @query {string} [status] - 状态过滤
 * @query {number} [limit=20] - 返回结果数量限制
 * @access Private
 */
router.get('/advanced-search', advancedSearchUsers);

/**
 * @route GET /api/users/search-suggestions
 * @description 获取搜索建议（用于前端自动补全）
 * @query {string} q - 搜索关键词
 * @query {number} [limit=10] - 返回结果数量限制
 * @access Private
 */
router.get('/search-suggestions', getSearchSuggestions);

/**
 * @route GET /api/users/statistics
 * @description 获取用户统计信息
 * @access Private (Admin only)
 */
router.get('/statistics', authorize(['admin']), getUserStatistics);

/**
 * @route GET /api/users/:id
 * @description 根据ID获取用户信息
 * @access Private
 */
router.get('/:id', validateUserId, getUserById);

/**
 * @route PUT /api/users/profile
 * @description 更新当前用户信息
 * @access Private
 */
router.put('/profile', updateProfile);

/**
 * @route PUT /api/users/:id
 * @description 更新指定用户信息（管理员权限）
 * @access Private (Admin only)
 */
router.put('/:id', validateUserId, authorize(['admin']), updateUser);

/**
 * @route DELETE /api/users/:id
 * @description 删除用户（软删除）
 * @access Private (Admin only)
 */
router.delete('/:id', validateUserId, authorize(['admin']), deleteUser);

/**
 * @route PUT /api/users/batch/status
 * @description 批量更新用户状态
 * @access Private (Admin only)
 */
router.put('/batch/status', authorize(['admin']), batchUpdateUserStatus);

module.exports = router;