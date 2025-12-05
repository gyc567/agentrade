#!/bin/bash

# 一键OKX配置验证脚本
# 用途: 快速验证OKX配置是否正确

echo "╔════════════════════════════════════════════════╗"
echo "║     OKX配置快速验证工具 v1.0                   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        return 0
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# 步骤1: 检查.env.local
echo "📋 步骤1: 检查 .env.local 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.local" ]; then
    echo "✓ .env.local 文件存在"

    if grep -q "OKX_API_KEY" .env.local; then
        echo "✓ OKX_API_KEY 配置项存在"
    else
        echo -e "${YELLOW}⚠️  OKX_API_KEY 配置项不存在${NC}"
    fi

    if grep -q "OKX_SECRET_KEY" .env.local; then
        echo "✓ OKX_SECRET_KEY 配置项存在"
    else
        echo -e "${YELLOW}⚠️  OKX_SECRET_KEY 配置项不存在${NC}"
    fi

    if grep -q "OKX_PASSPHASE" .env.local; then
        echo "✓ OKX_PASSPHASE 配置项存在"
    else
        echo -e "${YELLOW}⚠️  OKX_PASSPHASE 配置项不存在${NC}"
    fi
else
    echo -e "${RED}❌ .env.local 文件不存在${NC}"
fi

echo ""

# 步骤2: 检查数据库配置
echo "📋 步骤2: 检查数据库配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "config.db" ]; then
    echo "✓ config.db 数据库文件存在"

    # 查询OKX配置
    RESULT=$(sqlite3 config.db "SELECT api_key, secret_key, okx_passphrase FROM exchanges WHERE id='okx' AND user_id='admin';")

    if [ -n "$RESULT" ]; then
        # 解析结果
        IFS='|' read -r API_KEY SECRET_KEY PASSPHRASE <<< "$RESULT"

        if [ -n "$API_KEY" ] && [ "$API_KEY" != "" ]; then
            echo "✓ 数据库API Key已设置: ${API_KEY:0:8}****"
        else
            echo -e "${RED}❌ 数据库API Key为空${NC}"
        fi

        if [ -n "$SECRET_KEY" ] && [ "$SECRET_KEY" != "" ]; then
            echo "✓ 数据库Secret Key已设置: ${SECRET_KEY:0:8}****"
        else
            echo -e "${RED}❌ 数据库Secret Key为空${NC}"
        fi

        if [ -n "$PASSPHRASE" ] && [ "$PASSPHRASE" != "" ]; then
            echo "✓ 数据库Passphrase已设置: ${PASSPHRASE:0:4}****"
        else
            echo -e "${RED}❌ 数据库Passphrase为空${NC}"
        fi
    else
        echo -e "${RED}❌ 数据库中找不到OKX配置${NC}"
    fi
else
    echo -e "${RED}❌ config.db 数据库文件不存在${NC}"
fi

echo ""

# 步骤3: 检查环境变量
echo "📋 步骤3: 检查当前环境变量"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$OKX_API_KEY" ]; then
    echo -e "${GREEN}✓ OKX_API_KEY 已设置: ${OKX_API_KEY:0:8}****${NC}"
else
    echo -e "${YELLOW}⚠️  OKX_API_KEY 未设置${NC}"
fi

if [ -n "$OKX_SECRET_KEY" ]; then
    echo -e "${GREEN}✓ OKX_SECRET_KEY 已设置: ${OKX_SECRET_KEY:0:8}****${NC}"
else
    echo -e "${YELLOW}⚠️  OKX_SECRET_KEY 未设置${NC}"
fi

if [ -n "$OKX_PASSPHASE" ]; then
    echo -e "${GREEN}✓ OKX_PASSPHASE 已设置: ${OKX_PASSPHASE:0:4}****${NC}"
else
    echo -e "${YELLOW}⚠️  OKX_PASSPHASE 未设置${NC}"
fi

echo ""

# 步骤4: 运行API测试
echo "📋 步骤4: 运行OKX API连接测试"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v go &> /dev/null; then
    echo "✓ Go 环境已安装"

    if [ -f "test_okx_from_db.go" ]; then
        echo "✓ 测试工具存在"
        echo ""
        echo "🚀 正在运行测试..."
        echo ""

        go run test_okx_from_db.go
        TEST_EXIT_CODE=$?

        if [ $TEST_EXIT_CODE -eq 0 ]; then
            echo ""
            echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║  🎉 所有测试通过！配置正确！ 🎉      ║${NC}"
            echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
        else
            echo ""
            echo -e "${RED}╔════════════════════════════════════════╗${NC}"
            echo -e "${RED}║  ❌ 测试失败，请检查配置              ║${NC}"
            echo -e "${RED}╚════════════════════════════════════════╝${NC}"
        fi
    else
        echo -e "${RED}❌ 测试工具 test_okx_from_db.go 不存在${NC}"
    fi
else
    echo -e "${RED}❌ Go 环境未安装${NC}"
fi

echo ""
echo "📖 详细设置指南请查看: OKX_SETUP_GUIDE.md"
