const User = require('../models/User');
const { createError } = require('../middleware/errorHandler');

/**
 * 用户服务类
 * 处理用户信息管理、查询等业务逻辑
 */
class UserService {
  /**
   * 获取用户列表（分页）
   * @param {Object} options - 查询选项
   * @param {number} options.page - 页码
   * @param {number} options.limit - 每页数量
   * @param {string} options.sort - 排序方式
   * @param {string} options.search - 搜索关键词
   * @returns {Promise<Object>} 用户列表和分页信息
   */
  async getUserList(options = {}) {
    try {
      const { page = 1, limit = 10, sort = 'desc', search = '' } = options;
      
      const whereClause = {};
      
      // 搜索条件
      if (search) {
        whereClause[require('sequelize').Op.or] = [
          { username: { [require('sequelize').Op.like]: `%${search}%` } },
          { email: { [require('sequelize').Op.like]: `%${search}%` } }
        ];
      }

      const offset = (page - 1) * limit;
      
      const { count, rows } = await User.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        order: [['createdAt', sort.toUpperCase()]],
        offset,
        limit: parseInt(limit)
      });

      return {
        users: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 根据ID获取用户信息
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 用户信息
   */
  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: { exclude: ['password'] }
      });

      if (!user) {
        throw createError('用户不存在', 404, 'NotFoundError');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 更新用户信息
   * @param {number} userId - 用户ID
   * @param {Object} updateData - 更新数据
   * @param {string} updateData.email - 邮箱
   * @param {string} updateData.role - 角色
   * @param {string} updateData.status - 状态
   * @returns {Promise<Object>} 更新后的用户信息
   */
  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw createError('用户不存在', 404, 'NotFoundError');
      }

      // 检查邮箱是否被其他用户使用
      if (updateData.email && updateData.email !== user.email) {
        const emailExists = await User.isEmailExists(updateData.email);
        if (emailExists) {
          throw createError('邮箱已被其他用户使用', 409, 'ConflictError');
        }
      }

      // 更新用户信息
      await user.update(updateData);

      return user.getPublicInfo();
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
   * 删除用户（软删除）
   * @param {number} userId - 用户ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      
      if (!user) {
        throw createError('用户不存在', 404, 'NotFoundError');
      }

      // 软删除：将状态设置为inactive
      await user.update({ status: 'inactive' });

      return {
        message: '用户删除成功'
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 批量更新用户状态
   * @param {number[]} userIds - 用户ID数组
   * @param {string} status - 新状态
   * @returns {Promise<Object>} 批量更新结果
   */
  async batchUpdateUserStatus(userIds, status) {
    try {
      if (!Array.isArray(userIds) || userIds.length === 0) {
        throw createError('用户ID列表不能为空', 400, 'ValidationError');
      }

      if (!['active', 'inactive', 'banned'].includes(status)) {
        throw createError('无效的用户状态', 400, 'ValidationError');
      }

      const result = await User.update(
        { status },
        { 
          where: { 
            id: { [require('sequelize').Op.in]: userIds } 
          } 
        }
      );

      return {
        message: `成功更新 ${result[0]} 个用户的状态`,
        updatedCount: result[0]
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 获取用户统计信息
   * @returns {Promise<Object>} 用户统计信息
   */
  async getUserStatistics() {
    try {
      const totalUsers = await User.count();
      const activeUsers = await User.count({ where: { status: 'active' } });
      const inactiveUsers = await User.count({ where: { status: 'inactive' } });
      const bannedUsers = await User.count({ where: { status: 'banned' } });
      const adminUsers = await User.count({ where: { role: 'admin' } });

      // 今日新增用户
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayNewUsers = await User.count({ 
        where: { 
          createdAt: { 
            [require('sequelize').Op.gte]: today 
          } 
        } 
      });

      return {
        total: totalUsers,
        byStatus: {
          active: activeUsers,
          inactive: inactiveUsers,
          banned: bannedUsers
        },
        byRole: {
          admin: adminUsers,
          user: totalUsers - adminUsers
        },
        todayNew: todayNewUsers
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 搜索用户
   * @param {string} keyword - 搜索关键词
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>} 用户列表
   */
  async searchUsers(keyword, limit = 20) {
    try {
      if (!keyword || keyword.trim().length < 2) {
        throw createError('搜索关键词至少需要2个字符', 400, 'ValidationError');
      }

      const users = await User.findAll({
        where: {
          [require('sequelize').Op.or]: [
            { username: { [require('sequelize').Op.like]: `%${keyword}%` } },
            { email: { [require('sequelize').Op.like]: `%${keyword}%` } }
          ]
        },
        attributes: { exclude: ['password'] },
        limit: parseInt(limit)
      });

      return users;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();