# 数据库快速开始指南

## 🎯 一分钟了解

本项目提供了完整的数据库迁移和维护工具，支持SQLite和PostgreSQL，帮助您轻松管理Monnaire Trading Agent OS的数据库。

## 🚀 3种使用方式

### 方式1: 一键自动迁移（推荐新手）
```bash
bash database/migrate_to_neon.sh
```
📝 交互式完成所有步骤，自动检测问题，适合完全不懂数据库的新手。

### 方式2: 检查和修复现有问题
```bash
# 检查数据库状态
bash database/check_database.sh

# 如果发现问题，自动生成修复脚本
bash database/check_database.sh --fix
```
📝 适合已有数据库，需要诊断或修复问题的场景。

### 方式3: 手动操作（推荐有经验用户）
```bash
# 查看操作手册
cat database/数据库操作手册.md

# 修复OKX问题
sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx';"

# 验证修复
sqlite3 config.db "SELECT id, type FROM exchanges WHERE id = 'okx';"
```
📝 适合需要精确控制的高级用户。

## 📋 常用命令速查

### 检查数据库
```bash
# 快速检查
bash database/check_database.sh --check

# 显示所有检查和建议
bash database/check_database.sh

# 生成修复脚本
bash database/check_database.sh --fix
```

### 修复OKX问题
```bash
# 一行命令修复
sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx';"

# 验证修复结果
sqlite3 config.db "SELECT id, name, type FROM exchanges WHERE id = 'okx';"
```

### 迁移到Neon.tech
```bash
# 自动迁移（推荐）
bash database/migrate_to_neon.sh

# 手动迁移
psql "postgresql://USER:PASSWORD@HOST:PORT/DBNAME" -f database/migration.sql
```

### 备份数据库
```bash
# SQLite备份
cp config.db config.db.backup.$(date +%Y%m%d)

# SQL导出
sqlite3 config.db ".dump" > backup_$(date +%Y%m%d).sql
```

### 查看数据
```bash
# 查看所有交易所
sqlite3 config.db "SELECT * FROM exchanges WHERE user_id = 'default';"

# 查看系统配置
sqlite3 config.db "SELECT * FROM system_config;"
```

## 🎓 学习路径

### 新手（第一次使用）
1. 阅读 `database/README.md` 了解整体架构
2. 运行 `bash database/check_database.sh` 检查当前状态
3. 如需迁移，运行 `bash database/migrate_to_neon.sh`
4. 阅读 `database/数据库操作手册.md` 深入学习

### 进阶（需要自定义）
1. 查看 `database/migration.sql` 了解数据库结构
2. 学习SQLite和PostgreSQL语法差异
3. 手动执行迁移和配置

### 专家（维护和优化）
1. 研究 `database/check_database.sh` 的检查逻辑
2. 根据需要修改迁移脚本
3. 添加自定义检查和修复规则

## 📚 文档导航

| 文档 | 用途 | 读者 |
|------|------|------|
| `database/README.md` | 快速参考 | 所有用户 |
| `database/QUICK_START.md` | 本文档 | 新手 |
| `database/数据库操作手册.md` | 详细指南 | 进阶用户 |
| `DATABASE_INTEGRATION_SUMMARY.md` | 完整总结 | 所有人 |
| `../OKX_FIX_INSTRUCTIONS.md` | OKX修复 | 遇到OKX问题的用户 |

## ❓ 常见问题

### Q: 我是新手，应该从哪里开始？
A: 运行 `bash database/migrate_to_neon.sh`，按照提示操作即可。

### Q: 我想检查数据库是否有问题？
A: 运行 `bash database/check_database.sh --check`。

### Q: 我只想修复OKX问题？
A: 运行 `sqlite3 config.db "UPDATE exchanges SET type = 'cex' WHERE id = 'okx';"`。

### Q: 我想迁移到Neon.tech云数据库？
A: 运行 `bash database/migrate_to_neon.sh`，或者阅读 `database/数据库操作手册.md` 手动迁移。

### Q: 我遇到了错误怎么办？
A: 运行 `bash database/check_database.sh --suggestions`，查看详细建议。

## 🔗 相关资源

- [Neon.tech](https://neon.tech) - 推荐使用的PostgreSQL云数据库
- [PostgreSQL文档](https://www.postgresql.org/docs/) - 官方文档
- [SQLite文档](https://www.sqlite.org/docs.html) - 官方文档

## 💡 小贴士

1. **定期备份**: 重要操作前务必备份数据库
2. **先测试**: 生产环境操作前，先在测试环境验证
3. **看日志**: 脚本执行时注意查看输出和错误信息
4. **问问题**: 遇到困难时查看文档或寻求帮助

## 📞 获取帮助

如果遇到问题：

1. **首先**: 查看 `database/数据库操作手册.md` 的"常见问题"章节
2. **然后**: 运行 `bash database/check_database.sh --suggestions`
3. **最后**: 检查相关文档或寻求技术支持

---

**最后更新**: 2025-11-17
