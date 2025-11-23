#!/usr/bin/env node

/**
 * 数据库连接监控脚本
 * 用于监控生产环境数据库连接状态和性能
 */

const databaseConfig = require('../src/config/database');
const os = require('os');

class DatabaseMonitor {
  constructor() {
    this.stats = {
      startTime: new Date(),
      totalQueries: 0,
      failedQueries: 0,
      connectionErrors: 0,
      poolStats: {
        max: 0,
        min: 0,
        active: 0,
        idle: 0,
        waiting: 0
      }
    };
    
    this.monitorInterval = null;
  }

  /**
   * 开始监控
   */
  start() {
    console.log('🚀 启动数据库连接监控...');
    
    // 每30秒收集一次统计信息
    this.monitorInterval = setInterval(() => {
      this.collectStats();
      this.checkHealth();
    }, 30000);
    
    // 立即执行一次
    this.collectStats();
  }

  /**
   * 停止监控
   */
  stop() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      console.log('⏹️  停止数据库连接监控');
    }
  }

  /**
   * 收集统计信息
   */
  async collectStats() {
    try {
      const sequelize = databaseConfig.getSequelize();
      
      if (!sequelize) {
        console.log('⚠️  无数据库连接，跳过统计收集');
        return;
      }

      // 获取连接池状态
      const pool = sequelize.connectionManager.pool;
      if (pool) {
        this.stats.poolStats = {
          max: pool.max,
          min: pool.min,
          active: pool.using.length,
          idle: pool.available.length,
          waiting: pool.waiting.length
        };
      }

      // 获取系统负载
      const loadAvg = os.loadavg();
      const memoryUsage = process.memoryUsage();

      this.logStats(loadAvg, memoryUsage);
      
    } catch (error) {
      console.error('收集统计信息失败:', error.message);
      this.stats.connectionErrors++;
    }
  }

  /**
   * 检查健康状态
   */
  async checkHealth() {
    try {
      const sequelize = databaseConfig.getSequelize();
      
      if (!sequelize) {
        console.log('❌ 数据库连接不可用');
        return false;
      }

      // 测试连接
      await sequelize.authenticate();
      
      // 检查连接池状态
      const pool = sequelize.connectionManager.pool;
      if (pool) {
        const { active, idle, waiting } = this.stats.poolStats;
        
        // 警告条件
        if (waiting > 5) {
          console.warn(`⚠️  连接池等待队列过长: ${waiting} 个连接在等待`);
        }
        
        if (active >= pool.max - 1) {
          console.warn(`⚠️  连接池接近满载: ${active}/${pool.max} 个活跃连接`);
        }
        
        if (idle === 0 && active > 0) {
          console.warn('⚠️  连接池无空闲连接，可能存在连接泄漏');
        }
      }

      console.log('✅ 数据库连接健康检查通过');
      return true;
      
    } catch (error) {
      console.error('❌ 数据库健康检查失败:', error.message);
      this.stats.failedQueries++;
      return false;
    }
  }

  /**
   * 记录统计信息
   */
  logStats(loadAvg, memoryUsage) {
    const { poolStats } = this.stats;
    const uptime = Math.floor((new Date() - this.stats.startTime) / 1000);
    
    console.log(`\n📊 数据库连接监控报告 (运行时间: ${uptime}s)`);
    console.log(`🔗 连接池状态: ${poolStats.active}活跃/${poolStats.idle}空闲/${poolStats.waiting}等待 (最大:${poolStats.max})`);
    console.log(`💾 内存使用: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`📈 系统负载: ${loadAvg[0].toFixed(2)} (1分钟)`);
    console.log(`❌ 连接错误: ${this.stats.connectionErrors}`);
    console.log(`📝 失败查询: ${this.stats.failedQueries}`);
    
    // 性能建议
    this.provideRecommendations();
  }

  /**
   * 提供性能建议
   */
  provideRecommendations() {
    const { poolStats } = this.stats;
    
    if (poolStats.waiting > 10) {
      console.log('💡 建议: 考虑增加连接池最大连接数或优化查询性能');
    }
    
    if (poolStats.active === poolStats.max) {
      console.log('💡 建议: 连接池已满，可能需要调整连接池配置');
    }
    
    if (this.stats.connectionErrors > 5) {
      console.log('💡 建议: 检查数据库服务器状态和网络连接');
    }
  }

  /**
   * 生成详细报告
   */
  generateReport() {
    const uptime = Math.floor((new Date() - this.stats.startTime) / 1000);
    const successRate = this.stats.totalQueries > 0 
      ? ((this.stats.totalQueries - this.stats.failedQueries) / this.stats.totalQueries * 100).toFixed(2)
      : 100;

    return {
      timestamp: new Date().toISOString(),
      uptime: uptime,
      poolStats: this.stats.poolStats,
      performance: {
        totalQueries: this.stats.totalQueries,
        failedQueries: this.stats.failedQueries,
        successRate: successRate + '%',
        connectionErrors: this.stats.connectionErrors
      },
      system: {
        loadAverage: os.loadavg(),
        memoryUsage: process.memoryUsage(),
        platform: os.platform(),
        arch: os.arch()
      }
    };
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const monitor = new DatabaseMonitor();
  
  // 启动监控
  monitor.start();
  
  // 优雅关闭处理
  process.on('SIGINT', () => {
    console.log('\n收到 SIGINT 信号，停止监控...');
    monitor.stop();
    
    // 生成最终报告
    const report = monitor.generateReport();
    console.log('\n📋 最终监控报告:');
    console.log(JSON.stringify(report, null, 2));
    
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n收到 SIGTERM 信号，停止监控...');
    monitor.stop();
    process.exit(0);
  });
}

module.exports = DatabaseMonitor;