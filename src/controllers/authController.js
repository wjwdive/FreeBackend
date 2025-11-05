const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateBody, schemas } = require('../middleware/validation');

/**
 * 认证控制器类
 * 处理用户认证相关的HTTP请求
 */
class AuthController {
  /**
   * 用户注册
   * POST /api/auth/register
   */
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    
    res.status(201).json({
      statusCode: 201,
      message: result.message,
      data: {
        user: result.user,
        token: result.token
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 用户登录
   * POST /api/auth/login
   */
  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: {
        user: result.user,
        token: result.token
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 刷新令牌
   * POST /api/auth/refresh
   */
  refreshToken = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({
        statusCode: 400,
        message: '令牌不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const result = await authService.refreshToken(token);
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: {
        token: result.token
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 验证令牌
   * GET /api/auth/validate
   */
  validateToken = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({
        statusCode: 400,
        message: '令牌不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const result = await authService.validateToken(token);
    
    if (result.valid) {
      res.status(200).json({
        statusCode: 200,
        message: result.message,
        data: {
          valid: true,
          user: result.user
        },
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(401).json({
        statusCode: 401,
        message: result.message,
        data: {
          valid: false
        },
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * 修改密码
   * PUT /api/auth/password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        statusCode: 400,
        message: '旧密码和新密码不能为空',
        data: null,
        timestamp: new Date().toISOString()
      });
    }

    const result = await authService.changePassword(req.user.id, { oldPassword, newPassword });
    
    res.status(200).json({
      statusCode: 200,
      message: result.message,
      data: null,
      timestamp: new Date().toISOString()
    });
  });

  /**
   * 获取认证统计信息
   * GET /api/auth/statistics
   */
  getStatistics = asyncHandler(async (req, res) => {
    const result = await authService.getStatistics();
    
    res.status(200).json({
      statusCode: 200,
      message: '统计信息获取成功',
      data: result,
      timestamp: new Date().toISOString()
    });
  });
}

const authController = new AuthController();

// 导出验证中间件
const validateRegister = validateBody(schemas.register);
const validateLogin = validateBody(schemas.login);

module.exports = {
  authController,
  validateRegister,
  validateLogin
};