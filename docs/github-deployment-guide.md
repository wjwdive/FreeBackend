# GitHub部署指南

## 概述

本指南详细说明如何将FreeBackend项目上传到GitHub，并从服务器拉取代码进行部署。这种部署方式具有版本控制、协作开发和自动化部署等优势。

## 🎯 部署方案对比

| 方案 | 优点 | 适用场景 |
|------|------|----------|
| **GitHub部署** | 版本控制、协作方便、CI/CD | 生产环境、团队开发 |
| **直接部署** | 简单快速、无需GitHub | 测试环境、个人项目 |

## 📋 项目是否需要打包？

**不需要打包！** 您的Node.js项目可以直接部署源代码，原因如下：

1. **依赖管理** - 通过`package.json`和`package-lock.json`管理依赖
2. **环境一致性** - Docker确保运行环境一致
3. **源码部署** - 更易于调试和维护
4. **版本控制** - Git跟踪所有代码变更

## 🚀 GitHub部署流程

### 步骤1：准备Git仓库

#### 1.1 初始化本地Git仓库
```bash
# 在项目根目录执行
git init
git add .
git commit -m "Initial commit: FreeBackend API服务"
```

#### 1.2 创建GitHub仓库
1. 登录GitHub
2. 点击右上角"+" → "New repository"
3. 填写仓库信息：
   - Repository name: `freebackend`
   - Description: "功能完整的Node.js后端API服务"
   - Public/Private: 根据需求选择
   - 不勾选"Add a README file"（已有）

#### 1.3 关联远程仓库
```bash
git remote add origin https://github.com/your-username/freebackend.git
git branch -M main
git push -u origin main
```

### 步骤2：配置GitHub仓库

#### 2.1 添加仓库描述和标签
- 添加项目描述
- 设置相关标签：`nodejs`, `express`, `api`, `backend`, `docker`

#### 2.2 配置分支保护规则（可选）
```
Settings → Branches → Add branch protection rule
- Require pull request reviews before merging
- Require status checks to pass before merging
- Include administrators
```

#### 2.3 添加协作成员（团队开发）
```
Settings → Collaborators → Add people
```

### 步骤3：服务器配置

#### 3.1 服务器环境准备
```bash
# 登录到1Panel服务器
ssh user@your-server-ip

# 安装Git（如果未安装） centOS7 使用yum 安装
sudo apt update
sudo apt install git -y

# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# 安装Docker Compose
sudo apt install docker-compose-plugin -y
```

#### 3.2 拉取代码
```bash
# 创建部署目录
sudo mkdir -p /opt/apps
sudo chown $USER:$USER /opt/apps
cd /opt/apps

# 克隆项目
git clone https://github.com/your-username/freebackend.git
cd freebackend

# 如果是私有仓库，需要配置认证
# 方式1：使用SSH密钥
git clone git@github.com:your-username/freebackend.git

# 方式2：使用Personal Access Token
git clone https://your-token@github.com/your-username/freebackend.git
```

### 步骤4：环境配置

#### 4.1 创建环境变量文件
```bash
# 复制示例配置
cp .env.1panel.example .env

# 编辑环境变量
nano .env
```

#### 4.2 配置生产环境变量
```env
# 数据库配置
DB_PASSWORD=your_secure_production_password
MYSQL_ROOT_PASSWORD=your_secure_root_password

# JWT密钥（生产环境必须修改）
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here

# 应用配置
NODE_ENV=production
PORT=3000

# 其他生产环境配置
LOG_LEVEL=info
CORS_ORIGIN=https://yourdomain.com
```

### 步骤5：一键部署

#### 5.1 使用部署脚本
```bash
# 给脚本执行权限
chmod +x deploy-1panel.sh

# 执行部署
./deploy-1panel.sh
```

#### 5.2 手动部署
```bash
# 停止现有服务
docker-compose -f docker-compose.1panel.yml down

# 构建和启动
docker-compose -f docker-compose.1panel.yml build
docker-compose -f docker-compose.1panel.yml up -d

# 检查服务状态
docker-compose -f docker-compose.1panel.yml ps
```

## 🔄 自动化部署（CI/CD）

### GitHub Actions配置

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to 1Panel Server

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.6
      with:
        host: ${{ secrets.SERVER_HOST }}
        username: ${{ secrets.SERVER_USER }}
        key: ${{ secrets.SERVER_SSH_KEY }}
        script: |
          cd /opt/apps/freebackend
          git pull origin main
          chmod +x deploy-1panel.sh
          ./deploy-1panel.sh
```

### 配置GitHub Secrets

在GitHub仓库设置中配置：
- `SERVER_HOST`: 服务器IP地址
- `SERVER_USER`: 服务器用户名
- `SERVER_SSH_KEY`: 服务器SSH私钥

## 📊 部署验证

### 服务状态检查
```bash
# 检查容器状态
docker ps

# 查看服务日志
docker logs freebackend-api

# 健康检查
curl http://localhost:3000/health
```

### API功能测试
```bash
# 测试用户搜索
curl "http://localhost:3000/api/users/search?keyword=test"

# 测试头像API
curl "http://localhost:3000/api/avatars"

# 测试静态文件
curl "http://localhost:3000/avatars/default/avatar1.jpg"
```

## 🔧 维护和更新

### 代码更新流程

#### 1. 本地开发
```bash
# 创建功能分支
git checkout -b feature/new-feature

# 开发完成后提交
git add .
git commit -m "Add new feature"

# 推送到GitHub
git push origin feature/new-feature
```

#### 2. 代码审查和合并
- 创建Pull Request
- 代码审查
- 合并到main分支

#### 3. 自动部署
- GitHub Actions自动触发部署
- 或手动在服务器执行更新

### 服务器更新

#### 手动更新
```bash
# 登录服务器
ssh user@your-server-ip

# 进入项目目录
cd /opt/apps/freebackend

# 拉取最新代码
git pull origin main

# 重新部署
./deploy-1panel.sh
```

#### 回滚操作
```bash
# 回滚到上一个版本
git reset --hard HEAD~1

# 重新部署
./deploy-1panel.sh
```

## 🛡️ 安全最佳实践

### 1. 密钥管理
- 永远不要将敏感信息提交到GitHub
- 使用环境变量和GitHub Secrets
- 定期轮换密钥

### 2. 访问控制
- 使用SSH密钥认证
- 配置防火墙规则
- 限制不必要的端口访问

### 3. 监控和告警
- 配置服务监控
- 设置日志告警
- 定期安全扫描

## 📈 性能优化

### 1. 数据库优化
```sql
-- 添加索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 2. 缓存配置
```yaml
# 在docker-compose中添加Redis
redis:
  image: redis:alpine
  restart: unless-stopped
  volumes:
    - redis_data:/data
```

### 3. CDN配置
```nginx
# 静态文件CDN配置
location /avatars/ {
    proxy_pass http://cdn.yourdomain.com/;
    expires 30d;
}
```

## 🐛 故障排除

### 常见问题

#### 1. Git拉取失败
```bash
# 检查网络连接
ping github.com

# 检查SSH密钥配置
ssh -T git@github.com

# 重新配置认证
git remote set-url origin https://your-token@github.com/your-username/freebackend.git
```

#### 2. 依赖安装失败
```bash
# 清理缓存
npm cache clean --force

# 重新安装
rm -rf node_modules package-lock.json
npm install
```

#### 3. 容器启动失败
```bash
# 查看详细日志
docker logs freebackend-api

# 检查环境变量
docker exec freebackend-api env

# 重启服务
docker-compose -f docker-compose.1panel.yml restart
```

## 📚 扩展资源

### 相关文档
- [1Panel部署指南](./1panel-deployment-guide.md)
- [API使用说明](../README.md)
- [头像API文档](./avatar-api.md)

### 工具推荐
- **GitHub CLI**: 命令行操作GitHub
- **Docker Desktop**: 本地容器管理
- **1Panel**: 服务器运维管理

## 🎉 总结

通过GitHub部署FreeBackend项目，您可以获得：

1. **版本控制** - 完整的代码变更历史
2. **协作开发** - 团队协作和代码审查
3. **自动化部署** - CI/CD流水线
4. **备份安全** - 代码远程备份
5. **易于维护** - 简单的更新和回滚流程

现在您可以开始使用GitHub来管理您的项目部署了！