#!/bin/bash

# 自动部署脚本
# 用法: ./deploy.sh

echo "========== 开始部署 =========="

# 1. 进入项目目录
cd /www/wwwroot/uniapp || exit 1

# 2. 拉取最新代码
echo "[1/4] 拉取最新代码..."
git pull origin main

# 3. 安装依赖（如果有更新）
echo "[2/4] 安装后端依赖..."
cd backend
npm install

echo "[3/4] 安装 markdown-server 依赖..."
cd ../backend/markdown-server
npm install

# 4. 重启服务
echo "[4/4] 重启服务..."
pm2 restart all

echo "========== 部署完成 =========="
echo ""
echo "服务状态:"
pm2 status
