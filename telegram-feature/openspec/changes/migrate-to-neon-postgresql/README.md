# 迁移到Neon PostgreSQL - OpenSpec提案

## 📋 提案概述

**提案ID**: migrate-to-neon-postgresql  
**创建日期**: 2025-11-23  
**状态**: 📝 已创建，待实施  
**优先级**: P0 - 高优先级  

## 🎯 目标

完全移除SQLite支持，统一使用Neon PostgreSQL数据库，简化代码，提高可维护性。

## 📚 文档结构

```
openspec/changes/migrate-to-neon-postgresql/
├── README.md                          # 本文件
├── proposal.md                        # 提案说明
├── tasks.md                           # 任务清单
├── IMPLEMENTATION_PLAN.md             # 详细实施计划
└── specs/
    └── database-migration-spec.md     # 技术规范
```

## 🔍 背景

### 当前问题

1. **代码复杂**: 同时支持SQLite和PostgreSQL，代码有大量条件分支
2. **SQL不兼容**: 两种数据库语法不同，需要维护两套SQL
3. **技术债务**: SQLite只用于本地开发，生产环境用Neon
4. **维护成本**: 需要测试两种数据库，增加工作量

### 为什么迁移

1. **生产环境已使用Neon**: 实际部署使用PostgreSQL
2. **PostgreSQL更强大**: 更好的并发、性能、功能
3. **简化代码**: 移除条件分支，代码更清晰
4. **降低维护成本**: 只需维护一套SQL

## 📊 影响分析

### 受影响的文件

| 文件 | 修改程度 | 说明 |
|------|---------|------|
| `config/database.go` | 🔴 大量修改 | 核心数据库文件 |
| `go.mod` | 🟡 中等修改 | 移除SQLite依赖 |
| `main.go` | 🟢 少量修改 | 简化初始化 |
| `.env.example` | 🟢 少量修改 | 更新配置说明 |

### 受影响的功能

✅ **所有功能保持不变**，只是底层数据库改变

- 用户认证 ✓
- 模型配置 ✓
- 交易所配置 ✓
- 交易员管理 ✓
- 信号源配置 ✓
- 密码重置 ✓

## 🔧 主要变更

### 1. 移除SQLite支持

```diff
- import _ "github.com/mattn/go-sqlite3"
+ // SQLite已移除，只使用PostgreSQL
```

### 2. 简化数据库连接

```diff
- func NewDatabase(dbPath string) (*Database, error) {
-     useNeon := os.Getenv("USE_NEON") == "true"
-     if useNeon {
-         // PostgreSQL逻辑
-     } else {
-         // SQLite逻辑
-     }
- }

+ func NewDatabase() (*Database, error) {
+     databaseURL := os.Getenv("DATABASE_URL")
+     db, err := sql.Open("postgres", databaseURL)
+     // ...
+ }
```

### 3. SQL语法统一

| SQLite | PostgreSQL |
|--------|-----------|
| `AUTOINCREMENT` | `SERIAL` |
| `INTEGER PRIMARY KEY` | `SERIAL PRIMARY KEY` |
| `DATETIME` | `TIMESTAMP` |
| `BOOLEAN DEFAULT 0` | `BOOLEAN DEFAULT FALSE` |
| `INSERT OR REPLACE` | `INSERT ... ON CONFLICT ... DO UPDATE` |
| `INSERT OR IGNORE` | `INSERT ... ON CONFLICT DO NOTHING` |
| `?` | `$1, $2, $3...` |

## 📋 实施步骤

### 阶段1: 准备 (1小时)
- [x] 创建OpenSpec提案
- [ ] 备份当前代码
- [ ] 准备测试环境

### 阶段2: 代码修改 (4小时)
- [ ] 修改数据库连接逻辑
- [ ] 转换表创建语句
- [ ] 转换INSERT语句
- [ ] 转换参数占位符
- [ ] 重写触发器

### 阶段3: 测试 (2小时)
- [ ] 编译测试
- [ ] API测试
- [ ] 功能测试
- [ ] 性能测试

### 阶段4: 部署 (1小时)
- [ ] 更新环境变量
- [ ] 部署到生产环境
- [ ] 验证功能

## 🧪 测试计划

### 自动化测试
```bash
# 运行API测试
./test-backend-api.sh

# 预期: 10/10 测试通过
```

### 手动测试
- [ ] 用户注册
- [ ] 用户登录
- [ ] 创建交易员
- [ ] 配置模型
- [ ] 配置交易所
- [ ] 密码重置

## ⚠️ 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|---------|
| SQL语法错误 | 中 | 高 | 仔细检查，逐步测试 |
| 参数占位符遗漏 | 高 | 高 | 使用grep搜索，逐个修改 |
| 触发器不工作 | 中 | 中 | 测试验证 |
| 性能下降 | 低 | 中 | 性能测试 |

## 📈 预期收益

### 代码质量
- ✅ 减少代码行数（约-200行）
- ✅ 移除条件分支
- ✅ 提高可读性

### 维护成本
- ✅ 只需维护一套SQL
- ✅ 减少测试工作量
- ✅ 降低bug风险

### 性能
- ✅ PostgreSQL并发性能更好
- ✅ 更好的查询优化
- ✅ 支持更多高级特性

## 🎯 成功标准

1. ✅ 代码中无SQLite引用
2. ✅ go.mod中无SQLite依赖
3. ✅ 所有API测试通过
4. ✅ 所有功能正常工作
5. ✅ 性能无明显下降

## 📚 相关文档

- [提案说明](./proposal.md)
- [任务清单](./tasks.md)
- [实施计划](./IMPLEMENTATION_PLAN.md)
- [技术规范](./specs/database-migration-spec.md)
- [数据库迁移审计报告](../../../DATABASE_MIGRATION_AUDIT_REPORT.md)

## 🚀 下一步

1. **审查提案**: 确认迁移方案
2. **准备环境**: 确保Neon数据库可用
3. **开始实施**: 按照实施计划执行
4. **持续测试**: 每步完成后测试
5. **部署验证**: 部署后全面验证

## 💬 讨论

如有疑问或建议，请在提案中讨论。

---

**提案状态**: 📝 已创建  
**下一步**: 等待审批后开始实施  
**预计完成时间**: 1个工作日
