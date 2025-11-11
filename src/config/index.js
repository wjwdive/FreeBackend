const path = require('path');

// 基础配置
const config = {
  // 应用配置
  app: {
    name: process.env.APP_NAME || 'FreeBackend',
    version: process.env.APP_VERSION || '1.0.0',
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },

  // CORS配置
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://yourdomain.com'] 
      : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  },

  // 日志配置
  morgan: {
    format: process.env.NODE_ENV === 'production' ? 'combined' : 'dev'
  },

  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // 限制每个IP每15分钟最多100个请求
  },

  // Socket.IO配置
  socket: {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000, // 60秒
    pingInterval: 25000, // 25秒
    maxHttpBufferSize: 1e6, // 1MB
    transports: ['websocket', 'polling']
  },

  // 聊天功能配置
  chat: {
    maxMessageLength: parseInt(process.env.CHAT_MAX_MESSAGE_LENGTH) || 1000,
    maxRoomsPerUser: parseInt(process.env.CHAT_MAX_ROOMS_PER_USER) || 10,
    messageRetentionDays: parseInt(process.env.CHAT_MESSAGE_RETENTION_DAYS) || 30,
    cleanupInterval: parseInt(process.env.CHAT_CLEANUP_INTERVAL) || 24 * 60 * 60 * 1000, // 24小时
    allowFileUpload: process.env.CHAT_ALLOW_FILE_UPLOAD !== 'false', // 默认允许
    maxFileSize: parseInt(process.env.CHAT_MAX_FILE_SIZE) || 5 * 1024 * 1024 // 5MB
  },

  // 文件上传配置
  upload: {
    dest: process.env.UPLOAD_DEST || path.join(process.cwd(), 'uploads'),
    limits: {
      fileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
      files: parseInt(process.env.UPLOAD_MAX_FILES) || 5
    },
    fileFilter: (req, file, cb) => {
      const allowedMimes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'application/pdf'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('不支持的文件类型'), false);
      }
    }
  },

  // 安全配置
  security: {
    jwtSecret: process.env.JWT_SECRET || 'fallback-secret-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  }
};

// 开发环境特定配置
if (config.app.env === 'development') {
  config.cors.origin.push('http://localhost:3001');
  config.socket.cors.origin.push('http://localhost:3001');
  config.chat.messageRetentionDays = 7; // 开发环境保留7天
}

// 生产环境特定配置
if (config.app.env === 'production') {
  config.rateLimit.max = 1000; // 生产环境提高限制
  config.chat.maxMessageLength = 5000; // 生产环境允许更长的消息
}

module.exports = config;