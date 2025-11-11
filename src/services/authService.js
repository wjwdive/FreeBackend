const jwtConfig = require('../config/jwt');
const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

/**
 * 认证服务类
 * 处理用户注册、登录、令牌管理等业务逻辑
 */
class AuthService {
  /**
   * 用户注册
   * @param {Object} userData - 用户注册数据
   * @param {string} userData.username - 用户名
   * @param {string} userData.password - 密码
   * @param {string} userData.email - 邮箱
   * @returns {Promise<Object>} 注册结果
   */
  async register(userData) {
    try {
      const { username, password, email } = userData;

      // 检查用户名是否已存在
      if (await User.isUsernameExists(username)) {
        throw createError('用户名已存在', 409, 'ConflictError');
      }

      // 检查邮箱是否已存在
      if (await User.isEmailExists(email)) {
        throw createError('邮箱已存在', 409, 'ConflictError');
      }

      // 创建用户
      const user = await User.create({
        username,
        password,
        email
      });

      // 生成JWT令牌
      const token = jwtConfig.generateToken({
        userId: user.userId,
        username: user.username,
        role: user.role
      });

      return {
        user: user.getPublicInfo(),
        token,
        message: '注册成功'
      };
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        throw createError('数据验证失败', 400, 'ValidationError', validationErrors);
      }
      throw error;
    }
  }

  /**
   * 用户登录
   * @param {Object} credentials - 登录凭据
   * @param {string} credentials.username - 用户名
   * @param {string} credentials.password - 密码
   * @returns {Promise<Object>} 登录结果
   */
  async login(credentials) {
    try {
      const { username, password } = credentials;

      // 查找用户
      const user = await User.findByUsername(username);
      if (!user) {
        throw createError('用户名或密码错误', 401, 'UnauthorizedError');
      }

      // 检查用户状态
      if (user.status !== 'active') {
        throw createError('账户已被禁用', 403, 'ForbiddenError');
      }

      // 验证密码
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw createError('用户名或密码错误', 401, 'UnauthorizedError');
      }

      // 更新登录信息
      await user.updateLoginInfo();

      // 生成JWT令牌
      const token = jwtConfig.generateToken({
        userId: user.userId,
        username: user.username,
        role: user.role
      });

      return {
        user: user.getPublicInfo(),
        token,
        message: '登录成功'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 刷新令牌
   * @param {string} token - 旧令牌
   * @returns {Promise<Object>} 新令牌
   */
  async refreshToken(token) {
    try {
      // 验证旧令牌
      const decoded = jwtConfig.verifyToken(token);
      
      // 查找用户
      const user = await User.findByPk(decoded.userId);
      if (!user || user.status !== 'active') {
        throw createError('用户不存在或已被禁用', 401, 'UnauthorizedError');
      }

      // 生成新令牌
      const newToken = jwtConfig.refreshToken(token);

      return {
        token: newToken,
        message: '令牌刷新成功'
      };
    } catch (error) {
      throw createError('令牌刷新失败', 401, 'UnauthorizedError');
    }
  }

  /**
   * 验证令牌
   * @param {string} token - JWT令牌
   * @returns {Promise<Object>} 验证结果
   */
  async validateToken(token) {
    try {
      const decoded = jwtConfig.verifyToken(token);
      
      // 查找用户
      const user = await User.findByPk(decoded.userId);
      if (!user || user.status !== 'active') {
        throw createError('用户不存在或已被禁用', 401, 'UnauthorizedError');
      }

      return {
        valid: true,
        user: user.getPublicInfo(),
        message: '令牌有效'
      };
    } catch (error) {
      return {
        valid: false,
        user: null,
        message: error.message
      };
    }
  }

  /**
   * 修改密码
   * @param {number} userId - 用户ID
   * @param {Object} passwordData - 密码数据
   * @param {string} passwordData.oldPassword - 旧密码
   * @param {string} passwordData.newPassword - 新密码
   * @returns {Promise<Object>} 修改结果
   */
  async changePassword(userId, passwordData) {
    try {
      const { oldPassword, newPassword } = passwordData;

      // 查找用户
      const user = await User.findByPk(userId);
      if (!user) {
        throw createError('用户不存在', 404, 'NotFoundError');
      }

      // 验证旧密码
      const isValidPassword = await user.validatePassword(oldPassword);
      if (!isValidPassword) {
        throw createError('旧密码错误', 401, 'UnauthorizedError');
      }

      // 更新密码
      user.password = newPassword;
      await user.save();

      return {
        message: '密码修改成功'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayLoginUsers = await User.count({ 
        where: { 
          lastLoginAt: { 
            [require('sequelize').Op.gte]: today 
          } 
        } 
      });

      return {
        totalUsers,
        activeUsers,
        todayLoginUsers
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new AuthService();