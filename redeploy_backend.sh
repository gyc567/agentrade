#!/bin/bash

echo "🔧 重新构建和部署后端..."

# 构建Go后端
echo "📦 构建Go后端..."
go build -o nofx-backend main.go

if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
else
    echo "❌ 构建失败"
    exit 1
fi

# 检查当前运行的后端进程
echo "🔍 检查运行中的后端进程..."
pkill -f nofx-backend || echo "没有找到运行中的后端进程"

# 等待进程完全停止
sleep 2

# 启动新的后端进程
echo "🚀 启动后端服务..."
./nofx-backend &
BACKEND_PID=$!

echo "✅ 后端已启动 (PID: $BACKEND_PID)"

# 等待后端启动
sleep 3

# 测试后端健康检查
echo "🧪 测试后端健康检查..."
curl -s https://nofx-gyc567.replit.app/api/health || echo "⚠️ 健康检查失败，后端可能仍在启动中"

# 检查CORS配置
echo "🔍 检查CORS配置..."
curl -I -X OPTIONS https://nofx-gyc567.replit.app/api/competition 2>/dev/null | grep -i "access-control"

echo ""
echo "✅ 部署完成"
echo "📡 后端URL: https://nofx-gyc567.replit.app"
