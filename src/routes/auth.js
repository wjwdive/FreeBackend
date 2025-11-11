const express = require('express');
const multer = require('multer');
const {
  register,
  login,
  refreshToken,
  validateToken,
  changePassword,
  getStatistics,
  validateRegister,
  validateLogin
} = require('../controllers/authController');
const { authenticateToken, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @description 用户注册
 * @access Public
 */
router.post('/register', validateRegister, register);

/**
 * @route POST /api/auth/login
 * @description 用户登录
 * @access Public
 */
router.post('/login', validateLogin, login);

/**
 * @route POST /api/auth/refresh
 * @description 刷新令牌
 * @access Public
 */
router.post('/refresh', refreshToken);

/**
 * @route GET /api/auth/validate
 * @description 验证令牌
 * @access Public
 */
router.get('/validate', validateToken);

/**
 * @route PUT /api/auth/password
 * @description 修改密码
 * @access Private
 */
router.put('/password', authenticateToken, changePassword);

/**
 * @route GET /api/auth/statistics
 * @description 获取认证统计信息
 * @access Private (Admin only)
 */
router.get('/statistics', authenticateToken, authorize(['admin']), getStatistics);

module.exports = router;