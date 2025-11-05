const express = require('express');
const {
  userController,
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
router.get('/', validatePagination, userController.getUsers);

/**
 * @route GET /api/users/profile
 * @description 获取当前用户信息
 * @access Private
 */
router.get('/profile', userController.getProfile);

/**
 * @route GET /api/users/search
 * @description 搜索用户
 * @access Private
 */
router.get('/search', userController.searchUsers);

/**
 * @route GET /api/users/statistics
 * @description 获取用户统计信息
 * @access Private (Admin only)
 */
router.get('/statistics', authorize(['admin']), userController.getUserStatistics);

/**
 * @route GET /api/users/:id
 * @description 根据ID获取用户信息
 * @access Private
 */
router.get('/:id', validateUserId, userController.getUserById);

/**
 * @route PUT /api/users/profile
 * @description 更新当前用户信息
 * @access Private
 */
router.put('/profile', userController.updateProfile);

/**
 * @route PUT /api/users/:id
 * @description 更新指定用户信息（管理员权限）
 * @access Private (Admin only)
 */
router.put('/:id', validateUserId, authorize(['admin']), userController.updateUser);

/**
 * @route DELETE /api/users/:id
 * @description 删除用户（软删除）
 * @access Private (Admin only)
 */
router.delete('/:id', validateUserId, authorize(['admin']), userController.deleteUser);

/**
 * @route PUT /api/users/batch/status
 * @description 批量更新用户状态
 * @access Private (Admin only)
 */
router.put('/batch/status', authorize(['admin']), userController.batchUpdateUserStatus);

module.exports = router;