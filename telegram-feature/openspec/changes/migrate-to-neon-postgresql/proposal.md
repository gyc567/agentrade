# 完全迁移到Neon PostgreSQL数据库

## Why

当前系统同时支持SQLite和Neon PostgreSQL，导致：
1. 代码复杂度高，需要维护两套数据库逻辑
2. SQL语法不兼容问题（SQLite vs PostgreSQL）
3. 生产环境已使用Neon，SQLite代码成为技术债务
4. 增加测试和维护成本

## What Changes

### 核心变更
1. **移除SQLite依赖**
   - 删除 `github.com/mattn/go-sqlite3` 依赖
   - 移除所有SQLite特定代码

2. **统一使用PostgreSQL**
   - 只保留 `github.com/lib/pq` 驱动
   - 所有SQL语句使用PostgreSQL语法
   - 参数占位符统一使用 `$1, $2, $3...`

3. **SQL语法转换**
   - `AUTOINCREMENT` → `SERIAL`
   - `INTEGER PRIMARY KEY` → `SERIAL PRIMARY KEY`
   - `INSERT OR REPLACE` → `INSERT ... ON CONFLICT ... DO UPDATE`
   - `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`
   - `DATETIME` → `TIMESTAMP`
   - `datetime('now')` → `CURRENT_TIMESTAMP`
   - `?` → `$1, $2, $3...`

4. **触发器重写**
   - SQLite触发器语法 → PostgreSQL函数+触发器

5. **环境配置**
   - 移除 `USE_NEON` 环境变量（始终使用Neon）
   - 简化数据库连接逻辑

## Impact

### 受影响的文件
- `config/database.go` - 核心数据库文件（大量修改）
- `go.mod` - 移除SQLite依赖
- `main.go` - 简化数据库初始化
- `.env.example` - 更新环境变量说明
- 所有使用数据库的代码

### 受影响的功能
- ✅ 所有功能保持不变
- ✅ 只是底层数据库从SQLite改为PostgreSQL
- ⚠️ 本地开发需要PostgreSQL或使用Neon

### 风险评估
- **高风险**: SQL语法转换错误可能导致功能失效
- **中风险**: 参数占位符转换遗漏
- **低风险**: 环境配置问题

## Migration Strategy

### 阶段1: 准备（1小时）
1. 备份当前代码
2. 创建测试环境
3. 准备SQL转换清单

### 阶段2: 代码修改（4小时）
1. 修改数据库连接逻辑
2. 转换所有SQL语句
3. 修改参数占位符
4. 重写触发器

### 阶段3: 测试（2小时）
1. 单元测试
2. 集成测试
3. 功能测试

### 阶段4: 部署（1小时）
1. 更新环境变量
2. 部署到生产环境
3. 验证功能

## Rollback Plan

如果迁移失败：
1. 恢复代码到迁移前版本
2. 恢复环境变量配置
3. 重新部署

## Success Criteria

- ✅ 所有API测试通过
- ✅ 所有功能正常工作
- ✅ 代码中无SQLite引用
- ✅ go.mod中无SQLite依赖
- ✅ 性能无明显下降
