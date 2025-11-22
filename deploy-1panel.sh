#!/bin/bash

# FreeBackend 1Panel部署脚本
# 使用方法: ./deploy-1panel.sh

set -e

echo "🚀 FreeBackend 1Panel部署脚本"
echo "================================"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose未安装，请先安装Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p logs uploads public/avatars

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  未找到.env文件，创建示例配置..."
    cp .env.1panel.example .env
    echo "📝 请编辑 .env 文件并设置正确的环境变量"
    echo "   然后重新运行此脚本"
    exit 1
fi

# 加载环境变量
set -a
source .env
set +a

# 验证必要的环境变量
required_vars=("DB_PASSWORD" "MYSQL_ROOT_PASSWORD" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ] || [ "${!var}" = "your_secure_"* ]; then
        echo "❌ 环境变量 $var 未正确设置"
        echo "   请编辑 .env 文件并设置实际值"
        exit 1
    fi
done

echo "✅ 环境变量验证通过"

# 停止现有服务（如果存在）
echo "🛑 停止现有服务..."
docker-compose -f docker-compose.1panel.yml down || true

# 构建镜像
echo "🔨 构建Docker镜像..."
docker-compose -f docker-compose.1panel.yml build

# 启动服务
echo "🚀 启动服务..."
docker-compose -f docker-compose.1panel.yml up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 30

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查后端API服务
if docker ps | grep freebackend-api; then
    echo "✅ 后端API服务运行正常"
else
    echo "❌ 后端API服务启动失败"
    docker logs freebackend-api
    exit 1
fi

# 检查MySQL服务
if docker ps | grep freebackend-mysql; then
    echo "✅ MySQL服务运行正常"
else
    echo "❌ MySQL服务启动失败"
    docker logs freebackend-mysql
    exit 1
fi

# 测试API健康检查
echo "🧪 测试API健康检查..."
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ API健康检查通过"
else
    echo "❌ API健康检查失败"
    docker logs freebackend-api
    exit 1
fi

# 测试头像静态文件访问
echo "🖼️  测试头像静态文件访问..."
if curl -f http://localhost:3001/avatars/default/avatar1.jpg > /dev/null 2>&1; then
    echo "✅ 头像静态文件访问正常"
else
    echo "⚠️  头像静态文件访问失败（可能是占位符文件）"
fi

echo ""
echo "🎉 部署完成！"
echo ""
echo "📊 服务信息："
echo "   后端API: http://localhost:3001"
echo "   API文档: http://localhost:3001/api-docs"
echo "   健康检查: http://localhost:3001/health"
echo ""
echo "🔧 管理命令："
echo "   查看日志: docker logs freebackend-api"
echo "   停止服务: docker-compose -f docker-compose.1panel.yml down"
echo "   重启服务: docker-compose -f docker-compose.1panel.yml restart"
echo "   查看状态: docker-compose -f docker-compose.1panel.yml ps"
echo ""
echo "📝 下一步："
echo "   1. 配置域名和SSL证书（可选）"
echo "   2. 设置定期备份"
echo "   3. 配置监控告警"
echo "   4. 替换默认头像文件为真实图片"
echo ""

# 显示当前运行的容器
echo "🐳 当前运行的容器："
docker-compose -f docker-compose.1panel.yml ps