const { DataTypes } = require('sequelize');
const crypto = require('crypto');

// 延迟模型定义
let ApiKey = null;

/**
 * 获取API密钥模型
 * 延迟初始化模型，确保数据库连接已建立
 */
const getApiKeyModel = () => {
  if (!ApiKey) {
    const sequelize = require('../config/database').getSequelize();
    if (!sequelize) {
      throw new Error('数据库连接未初始化，请先调用 databaseConfig.init()');
    }

    ApiKey = sequelize.define('ApiKey', {
      keyId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id',
        comment: '密钥ID'
      },
      apiKey: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
        comment: 'API密钥'
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: '密钥名称'
      },
      description: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '密钥描述'
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'expired'),
        defaultValue: 'active',
        comment: '密钥状态'
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '过期时间'
      },
      requestLimit: {
        type: DataTypes.INTEGER,
        defaultValue: 1000,
        comment: '每日请求限制'
      },
      requestCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '今日请求计数'
      },
      lastRequestAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '最后请求时间'
      }
    }, {
      tableName: 'api_keys',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      indexes: [
        {
          fields: ['apiKey']
        },
        {
          fields: ['status']
        },
        {
          fields: ['expiresAt']
        }
      ]
    });

    /**
     * 生成新的API密钥
     * @param {Object} options - 密钥选项
     * @param {string} options.name - 密钥名称
     * @param {string} options.description - 密钥描述
     * @param {number} options.days - 有效天数（默认30天）
     * @param {number} options.requestLimit - 每日请求限制
     * @returns {Promise<Object>} 生成的密钥信息
     */
    ApiKey.generateKey = async function ({ name, description = '', days = 30, requestLimit = 1000 } = {}) {
      if (!name) {
        throw new Error('密钥名称不能为空');
      }

      // 生成随机API密钥
      const apiKey = crypto.randomBytes(32).toString('hex');

      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const keyRecord = await ApiKey.create({
        apiKey,
        name,
        description,
        expiresAt,
        requestLimit,
        status: 'active'
      });

      return {
        keyId: keyRecord.keyId,
        apiKey: keyRecord.apiKey,
        name: keyRecord.name,
        description: keyRecord.description,
        expiresAt: keyRecord.expiresAt,
        requestLimit: keyRecord.requestLimit,
        createdAt: keyRecord.createdAt
      };
    };

    /**
     * 验证API密钥
     * @param {string} apiKey - 要验证的API密钥
     * @returns {Promise<Object|null>} 密钥信息或null
     */
    ApiKey.validateKey = async function (apiKey) {
      const keyRecord = await ApiKey.findOne({
        where: {
          apiKey,
          status: 'active'
        }
      });

      if (!keyRecord) {
        return null;
      }

      // 检查是否过期
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        await keyRecord.update({ status: 'expired' });
        return null;
      }

      // 检查每日请求限制
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!keyRecord.lastRequestAt || keyRecord.lastRequestAt < today) {
        // 新的一天，重置计数
        await keyRecord.update({
          requestCount: 0,
          lastRequestAt: new Date()
        });
      }

      // 检查是否超过限制
      if (keyRecord.requestCount >= keyRecord.requestLimit) {
        return null;
      }

      // 增加请求计数
      await keyRecord.update({
        requestCount: keyRecord.requestCount + 1,
        lastRequestAt: new Date()
      });

      return {
        keyId: keyRecord.keyId,
        name: keyRecord.name,
        requestCount: keyRecord.requestCount,
        requestLimit: keyRecord.requestLimit
      };
    };

    /**
     * 获取密钥列表
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.limit - 每页数量
     * @returns {Promise<Object>} 分页结果
     */
    ApiKey.getKeyList = async function ({ page = 1, limit = 10 } = {}) {
      const offset = (page - 1) * limit;

      const { count, rows } = await ApiKey.findAndCountAll({
        attributes: { exclude: ['apiKey'] }, // 不返回实际的API密钥
        order: [['createdAt', 'DESC']],
        offset,
        limit
      });

      return {
        keys: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    };


    /**
     * 生成新的API密钥
     * @param {Object} options - 密钥选项
     * @param {string} options.name - 密钥名称
     * @param {string} options.description - 密钥描述
     * @param {number} options.days - 有效天数（默认30天）
     * @param {number} options.requestLimit - 每日请求限制
     * @returns {Promise<Object>} 生成的密钥信息
     */
    ApiKey.generateKey = async function ({ name, description = '', days = 30, requestLimit = 1000 } = {}) {
      if (!name) {
        throw new Error('密钥名称不能为空');
      }

      // 生成随机API密钥
      const apiKey = crypto.randomBytes(32).toString('hex');

      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const keyRecord = await ApiKey.create({
        apiKey,
        name,
        description,
        expiresAt,
        requestLimit,
        status: 'active'
      });

      return {
        keyId: keyRecord.keyId,
        apiKey: keyRecord.apiKey,
        name: keyRecord.name,
        description: keyRecord.description,
        expiresAt: keyRecord.expiresAt,
        requestLimit: keyRecord.requestLimit,
        createdAt: keyRecord.createdAt
      };
    };

    /**
     * 验证API密钥
     * @param {string} apiKey - 要验证的API密钥
     * @returns {Promise<Object|null>} 密钥信息或null
     */
    ApiKey.validateKey = async function (apiKey) {
      const keyRecord = await ApiKey.findOne({
        where: {
          apiKey,
          status: 'active'
        }
      });

      if (!keyRecord) {
        return null;
      }

      // 检查是否过期
      if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
        await keyRecord.update({ status: 'expired' });
        return null;
      }

      // 检查每日请求限制
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (!keyRecord.lastRequestAt || keyRecord.lastRequestAt < today) {
        // 新的一天，重置计数
        await keyRecord.update({
          requestCount: 0,
          lastRequestAt: new Date()
        });
      }

      // 检查是否超过限制
      if (keyRecord.requestCount >= keyRecord.requestLimit) {
        return null;
      }

      // 增加请求计数
      await keyRecord.update({
        requestCount: keyRecord.requestCount + 1,
        lastRequestAt: new Date()
      });

      return {
        keyId: keyRecord.keyId,
        name: keyRecord.name,
        requestCount: keyRecord.requestCount,
        requestLimit: keyRecord.requestLimit
      };
    };

    /**
     * 获取密钥列表
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.limit - 每页数量
     * @returns {Promise<Object>} 分页结果
     */
    ApiKey.getKeyList = async function ({ page = 1, limit = 10 } = {}) {
      const offset = (page - 1) * limit;

      const { count, rows } = await ApiKey.findAndCountAll({
        attributes: { exclude: ['apiKey'] }, // 不返回实际的API密钥
        order: [['createdAt', 'DESC']],
        offset,
        limit
      });

      return {
        keys: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    };

    /**
     * 禁用API密钥
     * @param {number} keyId - 密钥ID
     * @returns {Promise<boolean>} 是否成功禁用
     */
    ApiKey.disableKey = async function (keyId) {
      const result = await ApiKey.update(
        { status: 'inactive' },
        { where: { keyId } }
      );

      return result[0] > 0;
    };
  }
  
  return ApiKey;
};

module.exports = { getApiKeyModel };