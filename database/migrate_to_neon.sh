#!/bin/bash
# ============================================================
# Monnaire Trading Agent OS - 自动迁移脚本
# 功能：从SQLite迁移到Neon.tech PostgreSQL
# 版本：1.0
# 日期：2025-11-17
# ============================================================

set -e  # 遇到错误立即退出

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
        log_error "$1 未安装，请先安装 $1"
        exit 1
    fi
}

# 显示欢迎信息
show_banner() {
    echo "============================================================"
    echo "  Monnaire Trading Agent OS - 数据库迁移工具"
    echo "============================================================"
    echo ""
    echo "本脚本将帮助您："
    echo "  1. 验证SQLite数据库"
    echo "  2. 导出SQLite数据"
    echo "  3. 连接到Neon.tech"
    echo "  4. 执行迁移脚本"
    echo "  5. 导入数据"
    echo "  6. 验证结果"
    echo ""
}

# 获取用户输入
get_input() {
    local prompt=$1
    local default=$2
    local result=""

    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " result
        result=${result:-$default}
    else
        read -p "$prompt: " result
    fi

    echo $result
}

# 验证SQLite数据库
validate_sqlite() {
    log_info "步骤1: 验证SQLite数据库..."

    if [ ! -f "config.db" ]; then
        log_error "config.db 文件不存在！"
        log_info "请确保在项目根目录执行此脚本"
        exit 1
    fi

    # 检查数据库完整性
    if ! sqlite3 config.db "PRAGMA integrity_check;" &> /dev/null; then
        log_error "SQLite数据库完整性检查失败！"
        exit 1
    fi

    log_success "SQLite数据库验证通过"

    # 显示数据库信息
    log_info "数据库信息："
    sqlite3 config.db <<EOF
.mode column
.headers on
SELECT 'AI模型数量' as type, COUNT(*) as count FROM ai_models WHERE user_id = 'default';
SELECT '交易所数量' as type, COUNT(*) as count FROM exchanges WHERE user_id = 'default';
SELECT '交易员数量' as type, COUNT(*) as count FROM traders;
EOF
}

# 导出SQLite数据
export_sqlite_data() {
    log_info "步骤2: 导出SQLite数据..."

    mkdir -p migration_backup

    # 导出表数据
    sqlite3 config.db ".dump ai_models" > migration_backup/ai_models.sql
    sqlite3 config.db ".dump exchanges" > migration_backup/exchanges.sql
    sqlite3 config.db ".dump traders" > migration_backup/traders.sql
    sqlite3 config.db ".dump users" > migration_backup/users.sql
    sqlite3 config.db ".dump system_config" > migration_backup/system_config.sql
    sqlite3 config.db ".dump password_resets" > migration_backup/password_resets.sql
    sqlite3 config.db ".dump login_attempts" > migration_backup/login_attempts.sql
    sqlite3 config.db ".dump audit_logs" > migration_backup/audit_logs.sql
    sqlite3 config.db ".dump user_signal_sources" > migration_backup/user_signal_sources.sql
    sqlite3 config.db ".dump beta_codes" > migration_backup/beta_codes.sql

    log_success "SQLite数据已导出到 migration_backup/ 目录"
}

# 获取Neon连接信息
get_neon_config() {
    log_info "步骤3: 配置Neon.tech连接信息..."

    echo ""
    log_warning "请在Neon.tech控制台创建项目后，获取以下信息："
    echo "  - Host: xxxxxx.neon.tech"
    echo "  - Database: nofx"
    echo "  - User: xxxxxx"
    echo "  - Password: xxxxxx"
    echo ""

    HOST=$(get_input "Neon Host" "")
    DBNAME=$(get_input "Database Name" "nofx")
    USER=$(get_input "User" "")
    PASSWORD=$(get_input "Password" "")

    # 构造连接字符串
    NEON_URL="postgresql://${USER}:${PASSWORD}@${HOST}:5432/${DBNAME}"
}

# 测试Neon连接
test_neon_connection() {
    log_info "步骤4: 测试Neon连接..."

    if ! command -v psql &> /dev/null; then
        log_error "psql 未安装！"
        log_info "请安装PostgreSQL客户端："
        log_info "  macOS: brew install postgresql"
        log_info "  Ubuntu: sudo apt-get install postgresql-client-13"
        exit 1
    fi

    if ! psql "$NEON_URL" -c "SELECT 1;" &> /dev/null; then
        log_error "无法连接到Neon数据库！"
        log_info "请检查："
        log_info "  1. 连接信息是否正确"
        log_info "  2. 网络是否通畅"
        log_info "  3. Neon项目是否运行中"
        exit 1
    fi

    log_success "Neon连接测试成功"
}

# 执行迁移脚本
run_migration() {
    log_info "步骤5: 执行迁移脚本..."

    if [ ! -f "database/migration.sql" ]; then
        log_error "migration.sql 文件不存在！"
        log_info "请确保在项目根目录执行此脚本"
        exit 1
    fi

    log_info "正在创建表结构..."
    if ! psql "$NEON_URL" -f database/migration.sql; then
        log_error "迁移脚本执行失败！"
        exit 1
    fi

    log_success "迁移脚本执行成功"
}

# 导入数据
import_data() {
    log_info "步骤6: 导入数据..."

    # 清理导出的SQL文件中的SQLite特有语法
    log_info "清理SQLite语法..."

    for file in migration_backup/*.sql; do
        if [ -f "$file" ]; then
            # 删除SQLite特有指令
            sed -i.tmp '/^BEGIN TRANSACTION;/d' "$file"
            sed -i.tmp '/^COMMIT;/d' "$file"
            sed -i.tmp '/^PRAGMA foreign_keys=OFF;/d' "$file"
            sed -i.tmp '/^PRAGMA foreign_keys=ON;/d' "$file"

            # 替换布尔值
            sed -i.tmp 's/\b0\b/FALSE/g' "$file"
            sed -i.tmp 's/\b1\b/TRUE/g' "$file"

            # SQLite中BOOLEAN也是0/1，不需要特殊处理
            rm -f "${file}.tmp"
        fi
    done

    # 按顺序导入数据（避免外键约束问题）
    log_info "导入系统配置..."
    psql "$NEON_URL" -f migration_backup/system_config.sql || log_warning "系统配置导入可能有警告"

    log_info "导入用户数据..."
    psql "$NEON_URL" -f migration_backup/users.sql || log_warning "用户数据导入可能有警告"

    log_info "导入AI模型..."
    psql "$NEON_URL" -f migration_backup/ai_models.sql || log_warning "AI模型导入可能有警告"

    log_info "导入交易所..."
    psql "$NEON_URL" -f migration_backup/exchanges.sql || log_warning "交易所导入可能有警告"

    log_info "导入其他数据..."
    psql "$NEON_URL" -f migration_backup/password_resets.sql || true
    psql "$NEON_URL" -f migration_backup/login_attempts.sql || true
    psql "$NEON_URL" -f migration_backup/audit_logs.sql || true
    psql "$NEON_URL" -f migration_backup/user_signal_sources.sql || true
    psql "$NEON_URL" -f migration_backup/beta_codes.sql || true

    log_info "导入交易员配置..."
    psql "$NEON_URL" -f migration_backup/traders.sql || log_warning "交易员导入可能有警告"

    log_success "数据导入完成"
}

# 验证迁移结果
verify_migration() {
    log_info "步骤7: 验证迁移结果..."

    echo ""
    log_info "验证结果："
    psql "$NEON_URL" <<EOF
-- 显示表统计
\echo '=== 表统计 ==='
SELECT schemaname, tablename, n_tup_ins as rows_inserted
FROM pg_stat_user_tables
ORDER BY tablename;

\echo ''
\echo '=== AI模型 ==='
SELECT id, name, provider FROM ai_models WHERE user_id = 'default';

\echo ''
\echo '=== 交易所 ==='
SELECT id, name, type FROM exchanges WHERE user_id = 'default';

\echo ''
\echo '=== 系统配置项数 ==='
SELECT COUNT(*) as config_count FROM system_config;
EOF

    log_success "验证完成"
}

# 生成配置文件
generate_config() {
    log_info "生成应用配置文件..."

    cat > .env.migration << EOF
# 数据库配置
DATABASE_URL=$NEON_URL

# SQLite配置（保留作为备份）
# DATABASE_URL=sqlite:config.db

# 其他配置
ADMIN_MODE=true
BETA_MODE=false
API_SERVER_PORT=8080
EOF

    log_success "配置文件已生成: .env.migration"
    log_info "请将 .env.migration 重命名为 .env 或更新您的配置文件"
}

# 清理临时文件
cleanup() {
    log_info "清理临时文件..."
    # 保留备份，但不删除
    log_success "迁移备份保留在 migration_backup/ 目录"
}

# 显示完成信息
show_completion() {
    echo ""
    echo "============================================================"
    log_success "数据库迁移完成！"
    echo "============================================================"
    echo ""
    echo "下一步操作："
    echo "  1. 更新应用配置："
    echo "     cp .env.migration .env"
    echo ""
    echo "  2. 更新Go代码中的数据库连接（如果需要）："
    echo "     - 查找 'sql.Open(\"sqlite3\"' "
    echo "     - 替换为 'sql.Open(\"postgres\"' "
    echo ""
    echo "  3. 重新编译并启动应用："
    echo "     go build -o nofx-backend main.go"
    echo "     ./nofx-backend"
    echo ""
    echo "  4. 测试API："
    echo "     curl https://your-domain.com/api/supported-exchanges"
    echo ""
    echo "备份位置："
    echo "  - SQLite备份: migration_backup/"
    echo "  - 原始数据库: config.db"
    echo ""
    log_warning "请测试应用功能正常后再删除备份文件！"
    echo ""
}

# 主函数
main() {
    show_banner

    # 检查依赖
    check_command sqlite3
    check_command psql

    # 执行迁移步骤
    validate_sqlite
    export_sqlite_data
    get_neon_config
    test_neon_connection
    run_migration
    import_data
    verify_migration
    generate_config
    cleanup
    show_completion
}

# 捕获Ctrl+C
trap 'log_error "迁移被用户中断"; exit 1' INT

# 执行主函数
main "$@"
