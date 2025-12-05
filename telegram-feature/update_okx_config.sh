#!/bin/bash

# OKX配置更新脚本
# 用途: 更新数据库中的OKX API配置

echo "🧪 OKX配置更新工具"
echo "==================="
echo ""

# 检查环境变量
if [ -z "$OKX_API_KEY" ] || [ -z "$OKX_SECRET_KEY" ] || [ -z "$OKX_PASSPHASE" ]; then
    echo "❌ 错误: 请先设置环境变量"
    echo ""
    echo "使用方法:"
    echo "  export OKX_API_KEY=your_api_key"
    echo "  export OKX_SECRET_KEY=your_secret_key"
    echo "  export OKX_PASSPHASE=your_passphrase"
    echo "  ./update_okx_config.sh"
    echo ""
    echo "或者编辑 .env.local 文件并添加OKX配置"
    exit 1
fi

echo "✅ 环境变量检查通过"
echo ""

# 更新数据库
DB_PATH="config.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ 数据库文件不存在: $DB_PATH"
    exit 1
fi

echo "📊 更新数据库配置..."

# 执行SQL更新
sqlite3 "$DB_PATH" <<EOF
UPDATE exchanges
SET
  api_key = '$OKX_API_KEY',
  secret_key = '$OKX_SECRET_KEY',
  okx_passphrase = '$OKX_PASSPHASE',
  enabled = 1,
  updated_at = CURRENT_TIMESTAMP
WHERE id = 'okx' AND user_id = 'admin';
EOF

if [ $? -eq 0 ]; then
    echo "✅ 数据库更新成功"
    echo ""

    # 显示更新后的配置
    echo "📋 更新后的配置:"
    sqlite3 "$DB_PATH" "SELECT id, user_id, name, enabled, LENGTH(api_key) as api_key_len, LENGTH(secret_key) as secret_key_len, LENGTH(okx_passphrase) as passphrase_len FROM exchanges WHERE id = 'okx';"

    echo ""
    echo "🎉 OKX配置更新完成！"
    echo ""
    echo "现在可以运行测试工具验证连接:"
    echo "  go run test_okx_from_db.go"
else
    echo "❌ 数据库更新失败"
    exit 1
fi
