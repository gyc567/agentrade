#!/bin/bash

echo "🔧 构建后端（仅主程序，排除测试文件）..."

# 只编译必要的文件，排除测试和调试文件
go build -o nofx-backend \
    main.go \
    api/server.go \
    auth/auth.go \
    config/config.go \
    database/database.go \
    models/*.go \
    trader/*.go \
    manager/*.go \
    utils/utils.go \
    services/*.go \
    2>&1

if [ $? -eq 0 ]; then
    echo "✅ 构建成功"
    ls -lh nofx-backend
else
    echo "❌ 构建失败"
    exit 1
fi
