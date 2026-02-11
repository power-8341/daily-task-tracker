#!/bin/bash
# 阿里云部署脚本

# 服务器信息
SERVER_IP="47.109.107.69"
SERVER_USER="root"
PROJECT_DIR="/root/daily-task-tracker-prod"
GITHUB_REPO="https://github.com/power-8341/daily-task-tracker.git"

echo "🚀 开始部署到阿里云..."

# 1. 连接服务器并执行部署
ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
  echo "📦 拉取最新代码..."
  if [ -d "${PROJECT_DIR}" ]; then
    cd ${PROJECT_DIR}
    git pull origin main
  else
    git clone ${GITHUB_REPO} ${PROJECT_DIR}
    cd ${PROJECT_DIR}
  fi
  
  echo "📦 安装依赖..."
  npm install
  
  echo "🔨 构建项目..."
  npm run build
  
  echo "🛑 停止旧服务..."
  pm2 stop daily-task-tracker 2>/dev/null || true
  
  echo "🚀 启动新服务..."
  pm2 start npm --name "daily-task-tracker" -- start
  
  echo "✅ 部署完成！"
  pm2 status
EOF

echo "🎉 部署脚本执行完毕"
