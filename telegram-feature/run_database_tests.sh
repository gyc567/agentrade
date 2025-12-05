#!/bin/bash
# ============================================================
# Monnaire Trading Agent OS - 数据库测试运行脚本
# 功能：运行数据库单元测试
# 版本：1.0
# 日期：2025-01-XX
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -v, --verbose       详细输出"
    echo "  -c, --coverage      生成覆盖率报告"
    echo "  -r, --run PATTERN   运行匹配模式的测试"
    echo "  --setup             设置测试环境"
    echo "  --clean             清理测试数据"
    echo ""
    echo "示例:"
    echo "  $0                  # 运行所有测试"
    echo "  $0 -v               # 详细输出"
    echo "  $0 -c               # 生成覆盖率报告"
    echo "  $0 -r TestCreate    # 运行所有TestCreate*测试"
    echo "  $0 --setup          # 设置测试环境"
    echo ""
}

# 检查环境
check_environment() {
    echo -e "${BLUE}=== 检查测试环境 ===${NC}"
    echo ""

    # 检查Go版本
    if ! command -v go &> /dev/null; then
        echo -e "${RED}❌ Go未安装${NC}"
        echo "请安装Go 1.21+: https://golang.org/dl/"
        exit 1
    fi

    GO_VERSION=$(go version | awk '{print $3}')
    echo -e "${GREEN}✓ Go版本: $GO_VERSION${NC}"

    # 检查TEST_DATABASE_URL
    if [ -z "$TEST_DATABASE_URL" ]; then
        echo -e "${YELLOW}⚠ TEST_DATABASE_URL未设置${NC}"
        echo ""
        echo "请设置测试数据库连接字符串:"
        echo "  export TEST_DATABASE_URL=\"postgresql://user:pass@host:5432/testdb\""
        echo ""
        echo "或使用Neon.tech免费数据库:"
        echo "  1. 注册: https://neon.tech"
        echo "  2. 创建项目"
        echo "  3. 复制连接字符串"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✓ TEST_DATABASE_URL已设置${NC}"

    # 测试数据库连接
    echo -e "${BLUE}测试数据库连接...${NC}"
    if psql "$TEST_DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
        echo -e "${GREEN}✓ 数据库连接成功${NC}"
    else
        echo -e "${RED}❌ 数据库连接失败${NC}"
        echo "请检查连接字符串和数据库状态"
        exit 1
    fi

    echo ""
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}=== 安装测试依赖 ===${NC}"
    echo ""

    cd config || exit 1

    echo "安装testify..."
    go get github.com/stretchr/testify/assert
    go get github.com/stretchr/testify/require

    echo "安装PostgreSQL驱动..."
    go get github.com/lib/pq

    echo -e "${GREEN}✓ 依赖安装完成${NC}"
    echo ""

    cd ..
}

# 设置测试环境
setup_environment() {
    echo -e "${BLUE}=== 设置测试环境 ===${NC}"
    echo ""

    check_environment
    install_dependencies

    # 初始化数据库schema
    echo "初始化数据库schema..."
    if [ -f "database/migration.sql" ]; then
        psql "$TEST_DATABASE_URL" -f database/migration.sql &> /dev/null
        echo -e "${GREEN}✓ 数据库schema已初始化${NC}"
    else
        echo -e "${YELLOW}⚠ migration.sql未找到，跳过schema初始化${NC}"
    fi

    echo ""
    echo -e "${GREEN}✓ 测试环境设置完成${NC}"
    echo ""
}

# 清理测试数据
clean_test_data() {
    echo -e "${BLUE}=== 清理测试数据 ===${NC}"
    echo ""

    if [ -z "$TEST_DATABASE_URL" ]; then
        echo -e "${RED}❌ TEST_DATABASE_URL未设置${NC}"
        exit 1
    fi

    psql "$TEST_DATABASE_URL" <<EOF
DELETE FROM password_resets WHERE user_id LIKE 'test_%';
DELETE FROM login_attempts WHERE email LIKE 'test_%';
DELETE FROM audit_logs WHERE user_id LIKE 'test_%';
DELETE FROM traders WHERE user_id LIKE 'test_%';
DELETE FROM user_signal_sources WHERE user_id LIKE 'test_%';
DELETE FROM exchanges WHERE user_id LIKE 'test_%';
DELETE FROM ai_models WHERE user_id LIKE 'test_%';
DELETE FROM users WHERE id LIKE 'test_%';
EOF

    echo -e "${GREEN}✓ 测试数据已清理${NC}"
    echo ""
}

# 运行测试
run_tests() {
    local verbose=$1
    local coverage=$2
    local pattern=$3

    echo -e "${BLUE}=== 运行数据库测试 ===${NC}"
    echo ""

    cd config || exit 1

    # 构建测试命令
    local cmd="go test"
    
    if [ "$verbose" = true ]; then
        cmd="$cmd -v"
    fi

    if [ "$coverage" = true ]; then
        cmd="$cmd -cover -coverprofile=coverage.out"
    fi

    if [ -n "$pattern" ]; then
        cmd="$cmd -run $pattern"
    fi

    # 运行测试
    echo "执行: $cmd"
    echo ""

    if eval $cmd; then
        echo ""
        echo -e "${GREEN}✓ 所有测试通过${NC}"
        
        # 如果生成了覆盖率报告
        if [ "$coverage" = true ] && [ -f "coverage.out" ]; then
            echo ""
            echo -e "${BLUE}=== 覆盖率报告 ===${NC}"
            go tool cover -func=coverage.out | tail -n 1
            
            # 生成HTML报告
            go tool cover -html=coverage.out -o coverage.html
            echo -e "${GREEN}✓ HTML覆盖率报告已生成: config/coverage.html${NC}"
        fi
        
        cd ..
        return 0
    else
        echo ""
        echo -e "${RED}❌ 测试失败${NC}"
        cd ..
        return 1
    fi
}

# 主函数
main() {
    local verbose=false
    local coverage=false
    local pattern=""
    local setup=false
    local clean=false

    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            -c|--coverage)
                coverage=true
                shift
                ;;
            -r|--run)
                pattern="$2"
                shift 2
                ;;
            --setup)
                setup=true
                shift
                ;;
            --clean)
                clean=true
                shift
                ;;
            *)
                echo "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done

    echo ""
    echo "============================================================"
    echo "  Monnaire Trading Agent OS - 数据库测试"
    echo "============================================================"
    echo ""

    # 执行操作
    if [ "$setup" = true ]; then
        setup_environment
        exit 0
    fi

    if [ "$clean" = true ]; then
        clean_test_data
        exit 0
    fi

    # 检查环境
    check_environment

    # 运行测试
    run_tests $verbose $coverage "$pattern"
    exit_code=$?

    echo ""
    echo "============================================================"
    echo ""

    exit $exit_code
}

# 执行主函数
main "$@"
