# Monnaire Trading Agent OS - 数据库文档

本目录包含数据库迁移、维护和操作相关的所有文件。

## 📁 文件列表

| 文件名 | 类型 | 描述 | 适用场景 |
|--------|------|------|----------|
| `migration.sql` | SQL脚本 | 完整的数据库迁移脚本（SQLite→PostgreSQL） | 新建数据库、迁移到Neon |
| `数据库操作手册.md` | 文档 | 详细的操作指南和故障排除 | 所有用户、新手友好 |
| `migrate_to_neon.sh` | 脚本 | 自动迁移工具（SQLite→Neon） | 自动化迁移 |
| `check_database.sh` | 脚本 | 数据库状态检查和修复工具 | 诊断问题、验证状态 |

## 🚀 快速开始

### 方法1：使用自动迁移工具（推荐新手）

```bash
# 进入项目目录
cd /path/to/nofx

# 执行自动迁移
bash database/migrate_to_neon.sh
```

### 方法2：手动迁移（推荐有经验用户）

```bash
# 1. 准备PostgreSQL数据库（Neon.tech）
#    - 注册账号：https://neon.tech
#    - 创建项目

# 2. 执行迁移脚本
psql "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" -f database/migration.sql

# 3. 导出SQLite数据
sqlite3 config.db ".dump" > sqlite_backup.sql

# 4. 导入数据到PostgreSQL
psql "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" < sqlite_backup.sql
```

### 方法3：仅修复当前问题

如果只是OKX交易所配置问题：

```bash
# 检查数据库状态
bash database/check_database.sh --check

# 应用修复
sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx';"

# 验证修复
bash database/check_database.sh --fix
```

## 📋 支持的数据库

### SQLite3（开发环境）
- **状态**: ✅ 完全支持
- **用途**: 本地开发、测试
- **数据库文件**: `config.db`

### PostgreSQL（生产环境）
- **状态**: ✅ 完全支持
- **用途**: 生产部署、Neon.tech云数据库
- **推荐**: Neon.tech（免费500MB）

## 🛠️ 常见任务

### 检查数据库状态
```bash
# 检查SQLite
bash database/check_database.sh

# 只显示检查结果
bash database/check_database.sh --check

# 生成修复脚本
bash database/check_database.sh --fix
```

### 验证迁移结果
```bash
# 检查数据库是否完整
sqlite3 config.db "PRAGMA integrity_check;"

# 查看所有交易所
sqlite3 config.db "SELECT * FROM exchanges WHERE user_id = 'default';"

# 查看OKX类型
sqlite3 config.db "SELECT id, type FROM exchanges WHERE id = 'okx';"
```

### 修复OKX交易所问题
```bash
# 一键修复
sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx';"

# 验证
sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE id = 'okx';"
```

### 备份数据库
```bash
# SQLite备份
cp config.db config.db.backup.$(date +%Y%m%d)

# 导出SQL
sqlite3 config.db ".dump" > backup_$(date +%Y%m%d).sql
```

### 迁移到Neon.tech
```bash
# 自动迁移（包含所有步骤）
bash database/migrate_to_neon.sh
```

## 📚 文档链接

- [数据库操作手册.md](./数据库操作手册.md) - 详细的操作指南和故障排除
- [../OKX_FIX_INSTRUCTIONS.md](../OKX_FIX_INSTRUCTIONS.md) - OKX交易所修复指南
- [../SQLITE_TO_NEON_MIGRATION_GUIDE.md](../SQLITE_TO_NEON_MIGRATION_GUIDE.md) - 详细迁移指南

## 🎯 数据库结构

### 主要表

1. **ai_models** - AI模型配置
   - deepseek
   - qwen

2. **exchanges** - 交易所配置
   - binance (CEX)
   - hyperliquid (DEX)
   - aster (DEX)
   - okx (CEX) ← 最新添加

3. **traders** - 交易员配置

4. **system_config** - 系统配置

### 重要字段

- **exchanges.type**: `'cex'` 或 `'dex'`
- **exchanges.okx_passphrase**: OKX特有字段
- **traders.is_running**: 交易员运行状态

## ⚠️ 重要注意事项

1. **OKX类型字段**: 必须为 `'cex'`，否则前端不显示API Key
2. **备份**: 迁移前请务必备份数据库
3. **环境变量**: 迁移后需要设置 `DATABASE_URL`
4. **代码更新**: Go代码中的数据库连接可能需要更新

## 🔧 故障排除

### 问题1: OKX交易所配置界面缺少API Key

**现象**: 选择OKX Futures，模态框只显示Passphrase字段

**原因**: 数据库中OKX的type为`'okx'`，不是`'cex'`

**解决**:
```bash
sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx';"
```

### 问题2: 迁移到Neon后连接失败

**检查**:
```bash
# 测试连接
psql "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" -c "SELECT 1;"

# 查看错误信息
export PGPASSWORD=your_password
psql -h HOST -U USER -d DBNAME
```

### 问题3: 数据不完整

**检查**:
```bash
# 检查表数据
bash database/check_database.sh --check

# 重新执行迁移
psql "DATABASE_URL" -f database/migration.sql
```

## 📞 支持

如果遇到问题：

1. **首先**: 查看 `数据库操作手册.md` 的故障排除章节
2. **检查**: 运行 `bash database/check_database.sh --suggestions`
3. **备份**: 确保有数据库备份
4. **报告**: 提供错误信息和数据库类型

## 📝 更新日志

| 日期 | 版本 | 更新内容 |
|------|------|----------|
| 2025-11-17 | v1.0 | 初始版本，支持SQLite和PostgreSQL |
| 2025-11-17 | v1.1 | 添加OKX交易所支持，修复type字段 |
| 2025-11-17 | v1.2 | 添加自动迁移工具和检查工具 |

---

**维护者**: Monnaire Trading Agent OS Team
**最后更新**: 2025-11-17
