const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger配置选项
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FreeBackend API',
      version: '1.0.0',
      description: '功能完整的Node.js后端API服务',
      contact: {
        name: 'FreeBackend Team',
        email: 'support@freebackend.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器',
      },
      {
        url: 'https://api.freebackend.com',
        description: '生产服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: '用户ID',
              example: 1,
            },
            username: {
              type: 'string',
              description: '用户名',
              example: 'john_doe',
            },
            email: {
              type: 'string',
              description: '邮箱地址',
              example: 'john@example.com',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: '用户角色',
              example: 'user',
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'banned'],
              description: '用户状态',
              example: 'active',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              description: '最后登录时间',
            },
            loginCount: {
              type: 'integer',
              description: '登录次数',
              example: 5,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: '创建时间',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: '更新时间',
            },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: '登录成功',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                token: {
                  type: 'string',
                  description: 'JWT访问令牌',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                refreshToken: {
                  type: 'string',
                  description: '刷新令牌',
                  example: 'refresh_token_here',
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Unauthorized',
            },
            message: {
              type: 'string',
              example: '访问令牌无效',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: '当前页码',
              example: 1,
            },
            limit: {
              type: 'integer',
              description: '每页数量',
              example: 10,
            },
            total: {
              type: 'integer',
              description: '总记录数',
              example: 100,
            },
            pages: {
              type: 'integer',
              description: '总页数',
              example: 10,
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: '访问令牌无效或已过期',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        ValidationError: {
          description: '请求数据验证失败',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        NotFoundError: {
          description: '请求的资源不存在',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js'], // 扫描的文件路径
};

// 生成Swagger规范
const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi,
};