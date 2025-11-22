# 1Panel服务器部署指南

## 概述

本指南详细说明如何将FreeBackend项目部署到1Panel服务器。1Panel是一个现代化的开源Linux服务器运维管理面板，支持Docker容器化部署。

## 前置要求

- 1Panel服务器（已安装1Panel面板）
- 域名（可选，用于HTTPS）
- SSH访问权限

## 部署方案选择

### 方案一：Docker Compose部署（推荐）
**优点：** 简单、稳定、易于维护
**适用场景：** 生产环境部署

### 方案二：应用商店部署
**优点：** 一键部署、可视化配置
**适用场景：** 快速部署测试环境

### 方案三：手动部署
**优点：** 完全控制、灵活配置
**适用场景：** 定制化需求

## 方案一：Docker Compose部署（推荐）

### 1. 准备部署文件

将以下文件上传到1Panel服务器的部署目录（如 `/opt/freebackend`）：

```
freebackend/
├── docker-compose.1panel.yml
├── Dockerfile
├── package.json
├── server.js
├── src/
├── public/
├── logs/
├── uploads/
├── .env.1panel.example
└── docs/
```

### 2. 配置环境变量

在1Panel服务器上创建 `.env` 文件：

```bash
cd /opt/freebackend
cp .env.1panel.example .env
nano .env
```

修改环境变量：
```env
# 数据库配置
DB_PASSWORD=your_secure_db_password_here
MYSQL_ROOT_PASSWORD=your_secure_root_password_here

# JWT密钥（至少32位）
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here

# 应用配置
NODE_ENV=production
PORT=3001
```

### 3. 通过1Panel面板部署

1. **登录1Panel面板**
   - 打开浏览器访问1Panel面板
   - 输入用户名和密码登录

2. **创建应用**
   - 进入"应用商店"
   - 点击"创建应用"
   - 选择"自定义应用"

3. **配置应用**
   ```yaml
   应用名称: freebackend
   应用版本: 1.0.0
   部署路径: /opt/freebackend
   镜像来源: 源码构建
   构建方式: Docker Compose
   配置文件: docker-compose.1panel.yml
   ```

4. **环境变量配置**
   - 在环境变量标签页导入 `.env` 文件
   - 或手动添加环境变量

5. **启动应用**
   - 点击"部署"
   - 等待构建和启动完成

### 4. 验证部署

1. **检查容器状态**
   ```bash
   docker ps
   ```

2. **查看日志**
   ```bash
   docker logs freebackend-api
   ```

3. **测试API**
   ```bash
   curl http://localhost:3001/health
   ```

## 方案二：应用商店部署

### 1. 准备Docker镜像

首先构建并推送Docker镜像到镜像仓库：

```bash
# 构建镜像
docker build -t your-registry/freebackend:1.0.0 .

# 推送镜像
docker push your-registry/freebackend:1.0.0
```

### 2. 通过1Panel应用商店部署

1. **创建自定义应用模板**
   ```yaml
   version: '3.8'
   services:
     freebackend:
       image: your-registry/freebackend:1.0.0
       ports:
         - "3001:3001"
       environment:
         - NODE_ENV=production
       volumes:
         - ./data:/app/data
   ```

2. **在应用商店中部署**
   - 进入"应用商店"
   - 点击"创建应用"
   - 选择"自定义应用"
   - 使用准备好的模板

## 方案三：手动部署

### 1. 服务器准备

```bash
# 更新系统
apt update && apt upgrade -y

# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 安装Docker Compose
apt install docker-compose-plugin -y
```

### 2. 部署应用

```bash
# 创建部署目录
mkdir -p /opt/freebackend
cd /opt/freebackend

# 上传项目文件
# 使用SCP或Git克隆

# 设置权限
chmod +x deploy.sh

# 启动服务
docker-compose -f docker-compose.1panel.yml up -d
```

### 3. 配置反向代理（可选）

使用1Panel的网站功能配置Nginx反向代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态文件缓存
    location /avatars/ {
        alias /opt/freebackend/public/avatars/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 数据库初始化

### 自动初始化
项目包含数据库初始化脚本，首次启动时会自动创建表结构。

### 手动初始化（如果需要）

```bash
# 进入MySQL容器
docker exec -it freebackend-mysql mysql -u root -p

# 执行初始化脚本
source /docker-entrypoint-initdb.d/init.sql
```

## 监控和维护

### 1. 日志管理

1Panel提供完整的日志查看功能：
- 容器日志
- 应用日志
- 系统日志

### 2. 性能监控

使用1Panel的监控功能：
- CPU使用率
- 内存使用情况
- 磁盘IO
- 网络流量

### 3. 备份策略

配置定期备份：
- 数据库备份
- 应用数据备份
- 配置文件备份

## 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3001
   
   # 修改docker-compose端口映射
   ports:
     - "3001:3001"
   ```

2. **数据库连接失败**
   ```bash
   # 检查MySQL服务
   docker logs freebackend-mysql
   
   # 检查网络连接
   docker network ls
   ```

3. **权限问题**
   ```bash
   # 检查文件权限
   ls -la /opt/freebackend/uploads/
   
   # 修复权限
   chown -R 1000:1000 /opt/freebackend/uploads/
   ```

### 日志分析

关键日志文件：
- `/opt/freebackend/logs/error.log` - 错误日志
- `/opt/freebackend/logs/combined.log` - 综合日志
- 容器日志 - 通过1Panel面板查看

## 安全配置

### 1. 防火墙配置

通过1Panel防火墙管理：
- 只开放必要端口（80, 443, 22）
- 限制访问来源IP
- 启用Fail2Ban

### 2. SSL证书

使用1Panel的证书管理：
- 申请Let's Encrypt免费证书
- 配置HTTPS重定向
- 启用HSTS

### 3. 定期更新

- 定期更新Docker镜像
- 更新系统安全补丁
- 更新项目依赖

## 扩展配置

### 1. 负载均衡

对于高并发场景，可以配置多实例负载均衡：

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    image: freebackend:latest
    deploy:
      replicas: 3
    environment:
      - NODE_ENV=production
```

### 2. 缓存配置

添加Redis缓存服务：

```yaml
# 在docker-compose中添加
redis:
  image: redis:alpine
  container_name: freebackend-redis
  restart: unless-stopped
  command: redis-server --appendonly yes
  volumes:
    - redis_data:/data
```

## 性能优化

### 1. 数据库优化

```sql
-- 添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### 2. 应用优化

- 启用Gzip压缩
- 配置静态文件缓存
- 优化数据库查询

## 总结

通过1Panel部署FreeBackend项目，您可以获得：

1. **简单部署** - 可视化操作，一键部署
2. **稳定运行** - 容器化隔离，自动重启
3. **易于维护** - 完整的监控和日志系统
4. **安全可靠** - 内置安全功能和备份机制

建议使用方案一（Docker Compose部署）进行生产环境部署，这是最稳定和易于维护的方式。