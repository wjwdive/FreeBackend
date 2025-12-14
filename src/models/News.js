const { DataTypes, Op } = require('sequelize');

// 延迟模型定义
let News = null;

/**
 * 获取新闻模型
 * 延迟初始化模型，确保数据库连接已建立
 */
const getNewsModel = () => {
  if (!News) {
    const sequelize = require('../config/database').getSequelize();
    if (!sequelize) {
      throw new Error('数据库连接未初始化，请先调用 databaseConfig.init()');
    }

    News = sequelize.define('News', {
      newsId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'id',
        comment: '新闻ID'
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '新闻标题'
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: '新闻内容'
      },
      category: {
        type: DataTypes.ENUM('technology', 'sports', 'entertainment', 'politics', 'business'),
        defaultValue: 'technology',
        comment: '新闻分类'
      },
      author: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: '系统管理员',
        comment: '作者'
      },
      source: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '新闻来源'
      },
      publishDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: '发布时间'
      },
      status: {
        type: DataTypes.ENUM('published', 'draft', 'archived'),
        defaultValue: 'published',
        comment: '新闻状态'
      },
      viewCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '浏览次数'
      },
      tags: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '标签（逗号分隔）'
      }
    }, {
      tableName: 'news',
      timestamps: true,
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      indexes: [
        {
          fields: ['category']
        },
        {
          fields: ['publishDate']
        },
        {
          fields: ['status']
        }
      ]
    });

    /**
     * 获取新闻列表（分页）
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.limit - 每页数量
     * @param {string} options.category - 分类筛选
     * @param {string} options.keyword - 关键词搜索
     * @returns {Promise<Object>} 分页结果
     */
    News.getNewsList = async function ({ page = 1, limit = 10, category = null, keyword = null } = {}) {
      const offset = (page - 1) * limit;

      // 构建查询条件
      const where = { status: 'published' };
      if (category) {
        where.category = category;
      }
      if (keyword) {
        where.title = { [Op.like]: `%${keyword}%` };
      }

      const { count, rows } = await News.findAndCountAll({
        where,
        order: [['publishDate', 'DESC']],
        offset,
        limit
      });

      return {
        news: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    };

    /**
     * 增加新闻浏览量
     * @param {number} newsId - 新闻ID
     * @returns {Promise<void>}
     */
    News.incrementViewCount = async function (newsId) {
      await News.update(
        { viewCount: getSequelize().literal('viewCount + 1') },
        { where: { newsId } }
      );
    };

    /**
     * 获取新闻详情
     * @param {number} newsId - 新闻ID
     * @returns {Promise<News|null>} 新闻实例或null
     */
    News.getNewsDetail = async function (newsId) {
      const news = await News.findByPk(newsId);
      if (news && news.status === 'published') {
        // 增加浏览量
        await News.incrementViewCount(newsId);
        return news;
      }
      return null;
    };


    /**
     * 获取新闻列表（分页）
     * @param {Object} options - 查询选项
     * @param {number} options.page - 页码
     * @param {number} options.limit - 每页数量
     * @param {string} options.category - 分类筛选
     * @param {string} options.keyword - 关键词搜索
     * @returns {Promise<Object>} 分页结果
     */
    News.getNewsList = async function ({ page = 1, limit = 10, category = null, keyword = null } = {}) {
      const offset = (page - 1) * limit;

      // 构建查询条件
      const where = { status: 'published' };
      if (category) {
        where.category = category;
      }
      if (keyword) {
        where.title = { [Op.like]: `%${keyword}%` };
      }

      const { count, rows } = await News.findAndCountAll({
        where,
        order: [['publishDate', 'DESC']],
        offset,
        limit
      });

      return {
        news: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count,
          pages: Math.ceil(count / limit)
        }
      };
    };

    /**
     * 增加新闻浏览量
     * @param {number} newsId - 新闻ID
     * @returns {Promise<void>}
     */
    News.incrementViewCount = async function (newsId) {
      await News.update(
        { viewCount: News.sequelize.literal('viewCount + 1') },
        { where: { newsId } }
      );
    };

    /**
     * 获取新闻详情
     * @param {number} newsId - 新闻ID
     * @returns {Promise<News|null>} 新闻实例或null
     */
    News.getNewsDetail = async function (newsId) {
      const news = await News.findByPk(newsId);
      if (news && news.status === 'published') {
        // 增加浏览量
        await News.incrementViewCount(newsId);
        return news;
      }
      return null;
    };
  }

  return News;
};

module.exports = { getNewsModel };