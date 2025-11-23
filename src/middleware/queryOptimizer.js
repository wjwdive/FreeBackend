/**
 * 数据库查询优化中间件
 * 防止慢查询、连接泄漏和性能问题
 */

const databaseConfig = require('../config/database');

class QueryOptimizer {
  constructor() {
    this.slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD) || 5000; // 5秒
    this.maxQueryTime = parseInt(process.env.MAX_QUERY_TIME) || 30000; // 30秒
    this.queryTimeout = parseInt(process.env.QUERY_TIMEOUT) || 10000; // 10秒
  }

  /**
   * 查询执行监控中间件
   */
  monitor() {
    return async (req, res, next) => {
      const startTime = Date.now();
      const queryId = Math.random().toString(36).substr(2, 9);
      
      // 记录查询开始
      req.queryStartTime = startTime;
      req.queryId = queryId;
      
      // 监听响应完成事件
      res.on('finish', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 记录慢查询
        if (duration > this.slowQueryThreshold) {
          console.warn(`🐌 慢查询检测 (${queryId}): ${duration}ms - ${req.method} ${req.path}`);
          
          // 记录详细信息
          this.logSlowQuery({
            queryId,
            duration,
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      // 设置查询超时
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error(`⏰ 查询超时 (${queryId}): ${req.method} ${req.path}`);
          
          // 记录超时详情
          this.logQueryTimeout({
            queryId,
            method: req.method,
            path: req.path,
            duration: Date.now() - startTime,
            timestamp: new Date().toISOString()
          });
          
          if (!res.headersSent) {
            res.status(503).json({
              error: 'Service Unavailable',
              message: '查询执行超时，请稍后重试',
              queryId: queryId
            });
          }
        }
      }, this.queryTimeout);
      
      // 清理超时定时器
      res.on('finish', () => {
        clearTimeout(timeout);
      });
      
      try {
        await next();
      } catch (error) {
        // 记录查询错误
        this.logQueryError({
          queryId,
          error: error.message,
          method: req.method,
          path: req.path,
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        });
        
        throw error; // 继续传递错误
      }
    };
  }

  /**
   * 连接池健康检查中间件
   */
  healthCheck() {
    return async (req, res, next) => {
      const sequelize = databaseConfig.getSequelize();
      
      if (!sequelize) {
        return next();
      }
      
      try {
        // 检查连接池状态
        const pool = sequelize.connectionManager.pool;
        if (pool) {
          const activeConnections = pool.using ? pool.using.length : 0;
          const idleConnections = pool.available ? pool.available.length : 0;
          const waitingConnections = pool.waiting ? pool.waiting.length : 0;
          
          // 如果连接池状态异常，返回503
          if (waitingConnections > 10 || activeConnections >= pool.max - 1) {
            console.warn(`⚠️  连接池压力过大: ${activeConnections}活跃/${idleConnections}空闲/${waitingConnections}等待`);
            
            if (req.path !== '/health' && !req.path.startsWith('/api/health')) {
              return res.status(503).json({
                error: 'Service Temporarily Unavailable',
                message: '系统繁忙，请稍后重试',
                retryAfter: 30
              });
            }
          }
        }
        
        await next();
      } catch (error) {
        console.error('连接池健康检查失败:', error);
        await next(); // 继续处理请求
      }
    };
  }

  /**
   * 查询结果缓存中间件（简单实现）
   */
  cacheMiddleware(ttl = 300000) { // 默认5分钟
    const cache = new Map();
    
    return async (req, res, next) => {
      // 只缓存GET请求
      if (req.method !== 'GET') {
        return next();
      }
      
      const cacheKey = `${req.method}:${req.originalUrl}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        // 返回缓存结果
        res.set('X-Cache', 'HIT');
        return res.json(cached.data);
      }
      
      // 缓存响应
      const originalSend = res.json;
      res.json = function(data) {
        cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        res.set('X-Cache', 'MISS');
        originalSend.call(this, data);
      };
      
      await next();
    };
  }

  /**
   * 记录慢查询
   */
  logSlowQuery(details) {
    const logEntry = {
      type: 'SLOW_QUERY',
      ...details
    };
    
    // 生产环境可以记录到文件或监控系统
    if (process.env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.warn('慢查询详情:', logEntry);
    }
  }

  /**
   * 记录查询超时
   */
  logQueryTimeout(details) {
    const logEntry = {
      type: 'QUERY_TIMEOUT',
      ...details
    };
    
    console.error('查询超时详情:', logEntry);
  }

  /**
   * 记录查询错误
   */
  logQueryError(details) {
    const logEntry = {
      type: 'QUERY_ERROR',
      ...details
    };
    
    console.error('查询错误详情:', logEntry);
  }

  /**
   * 获取连接池统计信息
   */
  getPoolStats() {
    const sequelize = databaseConfig.getSequelize();
    
    if (!sequelize) {
      return null;
    }
    
    const pool = sequelize.connectionManager.pool;
    if (!pool) {
      return null;
    }
    
    return {
      max: pool.max,
      min: pool.min,
      active: pool.using ? pool.using.length : 0,
      idle: pool.available ? pool.available.length : 0,
      waiting: pool.waiting ? pool.waiting.length : 0,
      total: (pool.using ? pool.using.length : 0) + (pool.available ? pool.available.length : 0)
    };
  }

  /**
   * 清理连接池（用于维护）
   */
  async cleanupPool() {
    const sequelize = databaseConfig.getSequelize();
    
    if (!sequelize) {
      return;
    }
    
    try {
      // 强制清理空闲连接
      const pool = sequelize.connectionManager.pool;
      if (pool && pool.destroy) {
        // 销毁所有空闲连接
        pool.destroyAllNow();
        console.log('✅ 连接池清理完成');
      }
    } catch (error) {
      console.error('连接池清理失败:', error);
    }
  }
}

// 创建单例实例
const queryOptimizer = new QueryOptimizer();

module.exports = queryOptimizer;