#!/bin/bash
# ============================================================
# Monnaire Trading Agent OS - 数据库检查工具
# 功能：检查数据库状态和常见问题
# 版本：1.0
# 日期：2025-11-17
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 数据库类型检测
detect_database() {
    if [ -f "config.db" ]; then
        echo "sqlite"
    elif [ -n "$DATABASE_URL" ]; then
        if [[ $DATABASE_URL == *"postgresql"* ]]; then
            echo "postgresql"
        else
            echo "unknown"
        fi
    else
        echo "none"
    fi
}

# 显示SQLite状态
check_sqlite() {
    echo -e "${BLUE}=== SQLite数据库检查 ===${NC}"
    echo ""

    if [ ! -f "config.db" ]; then
        echo -e "${RED}❌ config.db 文件不存在${NC}"
        return 1
    fi

    # 检查完整性
    if sqlite3 config.db "PRAGMA integrity_check;" | grep -q "ok"; then
        echo -e "${GREEN}✓ 数据库完整性检查通过${NC}"
    else
        echo -e "${RED}❌ 数据库完整性检查失败${NC}"
        return 1
    fi

    # 检查OKX配置
    okx_type=$(sqlite3 config.db "SELECT type FROM exchanges WHERE id = 'okx' AND user_id = 'default';" 2>/dev/null || echo "")
    if [ "$okx_type" == "cex" ]; then
        echo -e "${GREEN}✓ OKX类型配置正确: $okx_type${NC}"
    else
        echo -e "${YELLOW}⚠ OKX类型配置异常: $okx_type (期望: cex)${NC}"
    fi

    # 检查交易所数量
    exchange_count=$(sqlite3 config.db "SELECT COUNT(*) FROM exchanges WHERE user_id = 'default';" 2>/dev/null || echo "0")
    echo -e "${BLUE}交易所数量: $exchange_count${NC}"
    if [ "$exchange_count" == "4" ]; then
        echo -e "${GREEN}✓ 交易所数量正确${NC}"
        sqlite3 config.db "SELECT '  - ' || id || ': ' || name FROM exchanges WHERE user_id = 'default' ORDER BY id;"
    else
        echo -e "${YELLOW}⚠ 交易所数量异常 (期望: 4)${NC}"
    fi

    # 检查AI模型数量
    model_count=$(sqlite3 config.db "SELECT COUNT(*) FROM ai_models WHERE user_id = 'default';" 2>/dev/null || echo "0")
    echo -e "${BLUE}AI模型数量: $model_count${NC}"
    if [ "$model_count" == "2" ]; then
        echo -e "${GREEN}✓ AI模型数量正确${NC}"
        sqlite3 config.db "SELECT '  - ' || id || ': ' || name FROM ai_models WHERE user_id = 'default' ORDER BY id;"
    else
        echo -e "${YELLOW}⚠ AI模型数量异常 (期望: 2)${NC}"
    fi

    # 检查系统配置
    config_count=$(sqlite3 config.db "SELECT COUNT(*) FROM system_config;" 2>/dev/null || echo "0")
    echo -e "${BLUE}系统配置项数: $config_count${NC}"

    # 检查表结构
    echo ""
    echo -e "${BLUE}表结构检查:${NC}"
    sqlite3 config.db ".tables" | tr ' ' '\n' | while read table; do
        echo -e "  ${GREEN}✓${NC} $table"
    done
}

# 显示PostgreSQL状态
check_postgresql() {
    echo -e "${BLUE}=== PostgreSQL数据库检查 ===${NC}"
    echo ""

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${YELLOW}⚠ DATABASE_URL 环境变量未设置${NC}"
        return 1
    fi

    # 测试连接
    if ! psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo -e "${RED}❌ 无法连接到数据库${NC}"
        return 1
    fi

    echo -e "${GREEN}✓ 数据库连接正常${NC}"

    # 检查表
    echo ""
    echo -e "${BLUE}表列表:${NC}"
    psql "$DATABASE_URL" -c "\dt" 2>/dev/null | grep -v "^List of relations" | grep -v "^Schema" | grep -v "^Name" | grep -v "^-----" | grep -v "^$"

    # 检查数据
    echo ""
    echo -e "${BLUE}数据统计:${NC}"
    psql "$DATABASE_URL" <<EOF 2>/dev/null
SELECT 'ai_models' as table_name, COUNT(*) as count FROM ai_models WHERE user_id = 'default'
UNION ALL
SELECT 'exchanges', COUNT(*) FROM exchanges WHERE user_id = 'default'
UNION ALL
SELECT 'system_config', COUNT(*) FROM system_config
UNION ALL
SELECT 'traders', COUNT(*) FROM traders;
EOF
}

# 生成修复脚本
generate_fix_script() {
    local db_type=$1

    echo ""
    echo -e "${BLUE}=== 生成修复脚本 ===${NC}"

    if [ "$db_type" == "sqlite" ]; then
        cat > fix_database.sql << 'EOF'
-- 数据库修复脚本
-- 适用于SQLite

-- 修复OKX类型
UPDATE exchanges SET type = 'cex' WHERE id = 'okx' AND user_id = 'default';

-- 确保所有默认交易所存在
INSERT OR IGNORE INTO exchanges (id, user_id, name, type, enabled) VALUES
    ('binance', 'default', 'Binance Futures', 'cex', 0),
    ('hyperliquid', 'default', 'Hyperliquid', 'dex', 0),
    ('aster', 'default', 'Aster DEX', 'dex', 0),
    ('okx', 'default', 'OKX Futures', 'cex', 0);

-- 确保默认AI模型存在
INSERT OR IGNORE INTO ai_models (id, user_id, name, provider, enabled) VALUES
    ('deepseek', 'default', 'DeepSeek', 'deepseek', 0),
    ('qwen', 'default', 'Qwen', 'qwen', 0);

-- 验证修复结果
SELECT '=== 交易所列表 ===' as info;
SELECT id, name, type FROM exchanges WHERE user_id = 'default' ORDER BY id;

SELECT '=== AI模型列表 ===' as info;
SELECT id, name, provider FROM ai_models WHERE user_id = 'default' ORDER BY id;
EOF
        echo -e "${GREEN}✓ 已生成修复脚本: fix_database.sql${NC}"
        echo -e "${BLUE}执行方法:${NC} sqlite3 config.db < fix_database.sql"
    fi
}

# 显示修复建议
show_fix_suggestions() {
    echo ""
    echo -e "${YELLOW}=== 常见问题修复建议 ===${NC}"
    echo ""

    echo -e "${BLUE}问题1: OKX交易所配置界面缺少API Key${NC}"
    echo -e "${YELLOW}解决方案:${NC}"
    echo "  sqlite3 config.db \"UPDATE exchanges SET type = 'cex' WHERE id = 'okx';\""
    echo ""

    echo -e "${BLUE}问题2: 数据库文件损坏${NC}"
    echo -e "${YELLOW}解决方案:${NC}"
    echo "  sqlite3 config.db \"PRAGMA integrity_check;\""
    echo "  如果检查失败，从备份恢复："
    echo "    sqlite3 config.db < backup.sql"
    echo ""

    echo -e "${BLUE}问题3: 数据不一致${NC}"
    echo -e "${YELLOW}解决方案:${NC}"
    echo "  使用修复脚本："
    echo "    bash database/check_database.sh --fix"
    echo ""
}

# 显示API测试命令
show_api_tests() {
    echo ""
    echo -e "${BLUE}=== API测试命令 ===${NC}"
    echo ""

    echo -e "${YELLOW}测试支持的交易所:${NC}"
    echo "  curl https://your-domain.com/api/supported-exchanges | jq"
    echo ""

    echo -e "${YELLOW}测试支持的AI模型:${NC}"
    echo "  curl https://your-domain.com/api/supported-models | jq"
    echo ""

    echo -e "${YELLOW}测试健康检查:${NC}"
    echo "  curl https://your-domain.com/api/health"
    echo ""
}

# 显示帮助信息
show_help() {
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  --check        仅检查数据库状态"
    echo "  --fix          生成修复脚本"
    echo "  --test         显示API测试命令"
    echo "  --suggestions  显示修复建议"
    echo ""
}

# 主函数
main() {
    local action="full"

    # 解析参数
    for arg in "$@"; do
        case $arg in
            -h|--help)
                show_help
                exit 0
                ;;
            --check)
                action="check"
                ;;
            --fix)
                action="fix"
                ;;
            --test)
                action="test"
                ;;
            --suggestions)
                action="suggestions"
                ;;
        esac
    done

    # 检测数据库类型
    DB_TYPE=$(detect_database)

    echo ""
    echo "============================================================"
    echo "  Monnaire Trading Agent OS - 数据库状态检查"
    echo "============================================================"
    echo ""

    case $DB_TYPE in
        sqlite)
            check_sqlite
            ;;
        postgresql)
            check_postgresql
            ;;
        none)
            echo -e "${RED}❌ 未检测到数据库${NC}"
            echo -e "${YELLOW}请确保存在以下文件之一:${NC}"
            echo "  - config.db (SQLite)"
            echo "  - DATABASE_URL环境变量 (PostgreSQL)"
            ;;
    esac

    case $action in
        fix)
            generate_fix_script $DB_TYPE
            ;;
        test)
            show_api_tests
            ;;
        suggestions)
            show_fix_suggestions
            show_api_tests
            ;;
        full)
            show_fix_suggestions
            show_api_tests
            ;;
    esac

    echo ""
    echo "============================================================"
    echo ""
}

# 执行主函数
main "$@"
