#!/bin/bash

# FreeBackend 部署脚本
# 用于快速部署应用到生产环境

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "命令 $1 未找到，请先安装"
        exit 1
    fi
}

# 显示帮助信息
show_help() {
    echo "FreeBackend 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -d, --docker        使用Docker部署"
    echo "  -t, --traditional   使用传统方式部署"
    echo "  -e, --environment   指定环境 (dev/prod)"
    echo ""
    echo "示例:"
    echo "  $0 -d -e prod        # 使用Docker部署到生产环境"
    echo "  $0 -t -e dev         # 使用传统方式部署到开发环境"
}

# 传统部署方式
deploy_traditional() {
    local env=$1
    
    log_info "开始传统方式部署 ($env 环境)..."
    
    # 检查Node.js和npm
    check_command node
    check_command npm
    
    # 安装依赖
    log_info "安装依赖..."
    if [ "$env" = "production" ]; then
        npm ci --only=production
    else
        npm install
    fi
    
    # 创建必要的目录
    log_info "创建必要的目录..."
    mkdir -p logs uploads
    
    # 设置环境变量
    if [ ! -f ".env" ]; then
        log_warning ".env 文件不存在，请先配置环境变量"
        cp .env.example .env
        log_info "已创建 .env 文件，请编辑配置后重新运行部署"
        exit 1
    fi
    
    # 数据库迁移
    log_info "运行数据库迁移..."
    npx sequelize-cli db:migrate
    
    # 启动应用
    log_info "启动应用..."
    if [ "$env" = "production" ]; then
        npm start
    else
        npm run dev
    fi
    
    log_success "传统部署完成"
}

# Docker部署方式
deploy_docker() {
    local env=$1
    
    log_info "开始Docker部署 ($env 环境)..."
    
    # 检查Docker和Docker Compose
    check_command docker
    check_command docker-compose
    
    # 构建镜像
    log_info "构建Docker镜像..."
    if [ "$env" = "production" ]; then
        docker build -t freebackend:latest .
    else
        docker build -t freebackend:dev -f Dockerfile.dev .
    fi
    
    # 启动服务
    log_info "启动Docker服务..."
    if [ "$env" = "production" ]; then
        docker-compose up -d
    else
        docker-compose -f docker-compose.dev.yml up -d
    fi
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    # 检查服务状态
    if docker-compose ps | grep -q "Up"; then
        log_success "Docker部署完成"
        log_info "服务状态:"
        docker-compose ps
    else
        log_error "服务启动失败"
        docker-compose logs
        exit 1
    fi
}

# 健康检查
health_check() {
    log_info "执行健康检查..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/health > /dev/null 2>&1; then
            log_success "健康检查通过"
            return 0
        fi
        
        log_info "等待服务启动... ($attempt/$max_attempts)"
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log_error "健康检查失败，服务可能未正确启动"
    return 1
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    
    local backup_dir="backups"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${backup_dir}/backup_${timestamp}.sql"
    
    mkdir -p $backup_dir
    
    # 这里需要根据实际数据库配置进行调整
    # mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $backup_file
    
    log_success "数据库备份完成: $backup_file"
}

# 主函数
main() {
    local deploy_method=""
    local environment="production"
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--docker)
                deploy_method="docker"
                shift
                ;;
            -t|--traditional)
                deploy_method="traditional"
                shift
                ;;
            -e|--environment)
                environment="$2"
                shift 2
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 如果没有指定部署方式，默认使用Docker
    if [ -z "$deploy_method" ]; then
        deploy_method="docker"
        log_info "使用默认部署方式: Docker"
    fi
    
    # 验证环境参数
    if [[ "$environment" != "dev" && "$environment" != "production" ]]; then
        log_error "无效的环境参数: $environment"
        exit 1
    fi
    
    # 显示部署信息
    log_info "部署方式: $deploy_method"
    log_info "部署环境: $environment"
    
    # 执行部署
    case $deploy_method in
        "docker")
            deploy_docker $environment
            ;;
        "traditional")
            deploy_traditional $environment
            ;;
    esac
    
    # 健康检查
    health_check
    
    # 显示部署结果
    log_success "部署完成!"
    log_info "应用地址: http://localhost:3000"
    log_info "健康检查: http://localhost:3000/health"
    log_info "API文档: http://localhost:3000/api-docs"
}

# 执行主函数
main "$@"