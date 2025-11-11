const { DataTypes } = require('sequelize');
const sequelize = require('../config/database').getSequelize();
const bcrypt = require('bcryptjs');

/**
 * 用户模型类
 * 定义用户数据表结构和相关方法
 */
const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'id', // 映射到数据库中的id字段
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50],
      isAlphanumeric: true
    },
    comment: '用户名'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    },
    comment: '邮箱地址'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: [6, 255]
    },
    comment: '加密后的密码'
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    comment: '用户角色'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'banned'),
    defaultValue: 'active',
    comment: '用户状态'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  loginCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '登录次数'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  hooks: {
    /**
     * 创建用户前加密密码
     */
    beforeCreate: async (user) => {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
    /**
     * 更新用户前检查密码是否需要重新加密
     */
    beforeUpdate: async (user) => {
      if (user.changed('password') && user.password) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  }
});

/**
 * 验证密码
 * @param {string} password - 待验证的密码
 * @returns {Promise<boolean>} 密码是否正确
 */
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

/**
 * 更新最后登录信息
 * @returns {Promise<void>}
 */
User.prototype.updateLoginInfo = async function() {
  this.lastLoginAt = new Date();
  this.loginCount += 1;
  await this.save();
};

/**
 * 获取用户基本信息（不包含敏感信息）
 * @returns {Object} 用户基本信息
 */
User.prototype.getPublicInfo = function() {
  return {
    userId: this.userId,
    username: this.username,
    email: this.email,
    role: this.role,
    status: this.status,
    lastLoginAt: this.lastLoginAt,
    loginCount: this.loginCount,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * 检查用户名是否已存在
 * @param {string} username - 用户名
 * @returns {Promise<boolean>} 是否存在
 */
User.isUsernameExists = async function(username) {
  const user = await User.findOne({ where: { username } });
  return !!user;
};

/**
 * 检查邮箱是否已存在
 * @param {string} email - 邮箱地址
 * @returns {Promise<boolean>} 是否存在
 */
User.isEmailExists = async function(email) {
  const user = await User.findOne({ where: { email } });
  return !!user;
};

/**
 * 根据用户名查找用户
 * @param {string} username - 用户名
 * @returns {Promise<User|null>} 用户实例或null
 */
User.findByUsername = async function(username) {
  return await User.findOne({ where: { username } });
};

/**
 * 根据邮箱查找用户
 * @param {string} email - 邮箱地址
 * @returns {Promise<User|null>} 用户实例或null
 */
User.findByEmail = async function(email) {
  return await User.findOne({ where: { email } });
};

/**
 * 获取用户列表（分页）
 * @param {Object} options - 查询选项
 * @param {number} options.page - 页码
 * @param {number} options.limit - 每页数量
 * @param {string} options.sort - 排序方式
 * @returns {Promise<Object>} 分页结果
 */
User.getUserList = async function({ page = 1, limit = 10, sort = 'desc' } = {}) {
  const offset = (page - 1) * limit;
  
  const { count, rows } = await User.findAndCountAll({
    attributes: { exclude: ['password'] },
    order: [['createdAt', sort.toUpperCase()]],
    offset,
    limit
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
};

module.exports = User;