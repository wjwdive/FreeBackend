const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const config = require('./config');
const logger = require('./middleware/logger');
const { responseLogger, apiStatistics } = require('./middleware/responseLogger');
const errorHandler = require('./middleware/errorHandler');
const queryOptimizer = require('./middleware/queryOptimizer');
const routes = require('./routes');
const { specs, swaggerUi } = require('./config/swagger');
const socketHandler = require('./socket');

const app = express();
const server = createServer(app);

// Socket.IO配置（可选启用）
const enableSocketIO = process.env.ENABLE_SOCKET_IO !== 'false'; // 默认启用
let io = null;

if (enableSocketIO) {
  io = new Server(server, config.socket);
  // Socket.IO处理器
  socketHandler(io);
  console.log('✅ Socket.IO 服务已启用');
} else {
  console.log('⏸️  Socket.IO 服务已禁用');
}

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors(config.cors));

// 速率限制
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    statusCode: 429,
    message: '请求过于频繁，请稍后再试',
    timestamp: new Date().toISOString()
  }
});
app.use(limiter);

// 请求解析中间件
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 日志中间件
app.use(logger);

// 响应日志中间件
app.use(responseLogger);
app.use(apiStatistics);

// 数据库查询优化中间件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(queryOptimizer.healthCheck());
  app.use(queryOptimizer.monitor());
}

// 静态文件服务
app.use('/uploads', express.static('uploads'));
app.use('/avatars', express.static('public/avatars'));

// API文档路由
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'FreeBackend API文档'
}));

// API路由
app.use('/api', routes);

// 健康检查端点
app.get('/health', (req, res) => {
  res.status(200).json({
    statusCode: 200,
    message: '服务运行正常',
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0'
    },
    timestamp: new Date().toISOString()
  });
});

// 404处理
app.use('*', (req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: '接口不存在',
    data: null,
    timestamp: new Date().toISOString()
  });
});

// 错误处理中间件（必须放在最后）
app.use(errorHandler);

module.exports = server;