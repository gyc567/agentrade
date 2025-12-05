#!/bin/bash
# 在Replit上应用的OKX修复脚本
# 用法：在Replit控制台执行
# bash apply_okx_fix.sh

echo "=== OKX交易所修复脚本 ==="
echo "正在修复OKX交易所配置界面缺少API Key和Secret Key的问题..."
echo

# 找到项目目录
PROJECT_DIR=$(ls /home/runner | grep nofx | head -1)
if [ -z "$PROJECT_DIR" ]; then
    echo "错误：未找到项目目录"
    exit 1
fi

cd "/home/runner/$PROJECT_DIR"

echo "当前目录: $(pwd)"
echo

# 检查config.db是否存在
if [ ! -f "config.db" ]; then
    echo "错误：config.db文件不存在"
    exit 1
fi

echo "步骤1：查看修复前的OKX配置"
echo "-----------------------------------"
sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE id = 'okx' AND user_id = 'default';"
echo

echo "步骤2：执行SQL修复"
echo "-----------------------------------"
sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx' AND user_id = 'default';"
echo "✓ 已将OKX类型从'okx'更新为'cex'"
echo

echo "步骤3：验证修复结果"
echo "-----------------------------------"
sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE id = 'okx' AND user_id = 'default';"
echo

echo "步骤4：查看所有支持的交易所"
echo "-----------------------------------"
sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE user_id = 'default' ORDER BY id;"
echo

echo "=== 修复完成 ==="
echo "现在OKX Futures的type为'cex'，前端将正确显示API Key和Secret Key字段。"
echo
echo "下一步：重启服务器使修复生效"
echo "  pkill -f nofx-backend"
echo "  ./nofx-backend &"
echo
echo "验证：访问 https://web-pink-omega-40.vercel.app/traders"
echo "      点击 'Exchanges' -> 'Add Exchange' -> 选择 'OKX Futures'"
echo "      现在应该看到API Key、Secret Key和Passphrase三个字段"
