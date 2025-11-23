#!/usr/bin/env node

/**
 * 生产环境日志查看脚本
 * 实时监控和分析应用日志
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class LogViewer {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.logFiles = {
      error: path.join(this.logDir, 'error.log'),
      combined: path.join(this.logDir, 'combined.log'),
      database: path.join(this.logDir, 'database.log')
    };
  }

  /**
   * 检查日志目录和文件
   */
  checkLogFiles() {
    if (!fs.existsSync(this.logDir)) {
      console.log('❌ 日志目录不存在:', this.logDir);
      return false;
    }

    const existingFiles = [];
    for (const [type, filePath] of Object.entries(this.logFiles)) {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        existingFiles.push({
          type,
          path: filePath,
          size: this.formatFileSize(stats.size),
          modified: stats.mtime
        });
      }
    }

    console.log('📁 日志文件状态:');
    existingFiles.forEach(file => {
      console.log(`   ${file.type.padEnd(10)} | ${file.size.padStart(8)} | ${file.modified.toLocaleString()}`);
    });

    return existingFiles.length > 0;
  }

  /**
   * 实时监控日志文件
   */
  tailLogFile(logType = 'combined', lines = 50) {
    const filePath = this.logFiles[logType];
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`❌ 日志文件不存在: ${logType}`);
      return;
    }

    console.log(`🔍 查看 ${logType} 日志 (最后 ${lines} 行):\n`);
    
    // 读取最后几行
    this.readLastLines(filePath, lines)
      .then(lines => {
        lines.forEach(line => console.log(line));
        console.log('\n⏹️  日志查看结束');
      })
      .catch(error => {
        console.error('读取日志失败:', error);
      });
  }

  /**
   * 实时跟踪日志（类似 tail -f）
   */
  followLogFile(logType = 'combined') {
    const filePath = this.logFiles[logType];
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`❌ 日志文件不存在: ${logType}`);
      return;
    }

    console.log(`👀 实时跟踪 ${logType} 日志 (Ctrl+C 退出):\n`);

    const stream = fs.createReadStream(filePath, {
      encoding: 'utf8',
      start: fs.statSync(filePath).size // 从文件末尾开始
    });

    const rl = readline.createInterface({
      input: stream,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      console.log(line);
    });

    // 监听文件变化
    fs.watchFile(filePath, (curr, prev) => {
      if (curr.size > prev.size) {
        // 文件有新增内容，重新创建流
        stream.destroy();
        this.followLogFile(logType);
      }
    });

    // 优雅退出
    process.on('SIGINT', () => {
      console.log('\n⏹️  停止日志跟踪');
      fs.unwatchFile(filePath);
      stream.destroy();
      process.exit(0);
    });
  }

  /**
   * 搜索日志内容
   */
  searchLogs(keyword, logType = 'combined', caseSensitive = false) {
    const filePath = this.logFiles[logType];
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.log(`❌ 日志文件不存在: ${logType}`);
      return;
    }

    console.log(`🔎 在 ${logType} 日志中搜索: "${keyword}"\n`);

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    let matchCount = 0;
    const regex = new RegExp(
      caseSensitive ? keyword : keyword,
      caseSensitive ? 'g' : 'gi'
    );

    rl.on('line', (line) => {
      if (regex.test(line)) {
        console.log(line);
        matchCount++;
      }
    });

    rl.on('close', () => {
      console.log(`\n📊 找到 ${matchCount} 条匹配记录`);
    });
  }

  /**
   * 分析错误日志
   */
  analyzeErrors(hours = 24) {
    const filePath = this.logFiles.error;
    
    if (!filePath || !fs.existsSync(filePath)) {
      console.log('❌ 错误日志文件不存在');
      return;
    }

    console.log(`📊 分析最近 ${hours} 小时的错误日志:\n`);

    const sinceTime = Date.now() - (hours * 60 * 60 * 1000);
    const errorStats = {
      total: 0,
      byType: {},
      byHour: {},
      recentErrors: []
    };

    const rl = readline.createInterface({
      input: fs.createReadStream(filePath),
      output: process.stdout,
      terminal: false
    });

    rl.on('line', (line) => {
      try {
        const logEntry = JSON.parse(line);
        const logTime = new Date(logEntry.timestamp || logEntry.time).getTime();
        
        if (logTime >= sinceTime) {
          errorStats.total++;
          
          // 按错误类型统计
          const errorType = logEntry.level || 'unknown';
          errorStats.byType[errorType] = (errorStats.byType[errorType] || 0) + 1;
          
          // 按小时统计
          const hour = new Date(logTime).getHours();
          errorStats.byHour[hour] = (errorStats.byHour[hour] || 0) + 1;
          
          // 记录最近错误
          if (errorStats.recentErrors.length < 10) {
            errorStats.recentErrors.push({
              time: new Date(logTime).toLocaleString(),
              message: logEntry.message || 'No message',
              level: errorType
            });
          }
        }
      } catch (error) {
        // 非JSON格式的日志行
      }
    });

    rl.on('close', () => {
      console.log('错误统计:');
      console.log(`   总错误数: ${errorStats.total}`);
      
      console.log('\n按类型分布:');
      Object.entries(errorStats.byType).forEach(([type, count]) => {
        console.log(`   ${type.padEnd(10)}: ${count}`);
      });
      
      console.log('\n按小时分布:');
      Object.entries(errorStats.byHour)
        .sort(([a], [b]) => a - b)
        .forEach(([hour, count]) => {
          console.log(`   ${hour.toString().padStart(2)}时: ${count}`);
        });
      
      if (errorStats.recentErrors.length > 0) {
        console.log('\n最近错误:');
        errorStats.recentErrors.forEach(error => {
          console.log(`   [${error.time}] ${error.level}: ${error.message}`);
        });
      }
    });
  }

  /**
   * 读取文件最后几行
   */
  async readLastLines(filePath, numLines) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let bytesRead = 0;
      const fileSize = fs.statSync(filePath).size;
      const chunkSize = 1024;
      
      const stream = fs.createReadStream(filePath, {
        start: Math.max(0, fileSize - chunkSize * 10)
      });
      
      stream.on('data', chunk => {
        chunks.unshift(chunk); // 反向存储
        bytesRead += chunk.length;
      });
      
      stream.on('end', () => {
        const content = Buffer.concat(chunks.reverse()).toString('utf8');
        const lines = content.split('\n').filter(line => line.trim());
        resolve(lines.slice(-numLines));
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * 格式化文件大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 显示使用帮助
   */
  showHelp() {
    console.log(`
📋 日志查看工具使用说明

命令格式:
  node scripts/log-viewer.js [命令] [参数]

可用命令:
  check                   检查日志文件状态
  view [类型] [行数]     查看日志最后几行
  follow [类型]           实时跟踪日志
  search [关键词] [类型] 搜索日志内容
  analyze [小时数]       分析错误日志
  help                   显示此帮助信息

日志类型:
  combined               综合日志（默认）
  error                  错误日志
  database               数据库日志

示例:
  node scripts/log-viewer.js check
  node scripts/log-viewer.js view error 100
  node scripts/log-viewer.js follow combined
  node scripts/log-viewer.js search "Timeout" error
  node scripts/log-viewer.js analyze 24
`);
  }
}

// 命令行参数处理
const args = process.argv.slice(2);
const viewer = new LogViewer();

if (args.length === 0) {
  viewer.showHelp();
  process.exit(0);
}

const command = args[0];

switch (command) {
  case 'check':
    viewer.checkLogFiles();
    break;
    
  case 'view':
    const logType = args[1] || 'combined';
    const lines = parseInt(args[2]) || 50;
    viewer.tailLogFile(logType, lines);
    break;
    
  case 'follow':
    const followType = args[1] || 'combined';
    viewer.followLogFile(followType);
    break;
    
  case 'search':
    const keyword = args[1];
    if (!keyword) {
      console.log('❌ 请提供搜索关键词');
      process.exit(1);
    }
    const searchType = args[2] || 'combined';
    viewer.searchLogs(keyword, searchType);
    break;
    
  case 'analyze':
    const hours = parseInt(args[1]) || 24;
    viewer.analyzeErrors(hours);
    break;
    
  case 'help':
  default:
    viewer.showHelp();
    break;
}