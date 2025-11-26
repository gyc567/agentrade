# 数据库迁移规范 - SQLite到PostgreSQL

## REMOVED Requirements

### Requirement: SQLite Support
系统 SHALL NOT 支持SQLite数据库。

#### Scenario: 移除SQLite驱动
- **WHEN** 系统启动时
- **THEN** 系统不应导入 `github.com/mattn/go-sqlite3`
- **THEN** 系统不应包含SQLite特定代码

#### Scenario: 移除双数据库支持
- **WHEN** 系统初始化数据库时
- **THEN** 系统不应检查 `USE_NEON` 环境变量
- **THEN** 系统不应有SQLite连接逻辑

## ADDED Requirements

### Requirement: PostgreSQL Only Support
系统 SHALL 只支持PostgreSQL数据库（通过Neon）。

#### Scenario: 使用PostgreSQL驱动
- **WHEN** 系统启动时
- **THEN** 系统应导入 `github.com/lib/pq`
- **THEN** 系统应使用 `postgres` 驱动名称

#### Scenario: 连接到Neon数据库
- **WHEN** 系统初始化数据库时
- **THEN** 系统应从 `DATABASE_URL` 环境变量读取连接字符串
- **THEN** 系统应使用 `sql.Open("postgres", databaseURL)` 连接
- **THEN** 如果 `DATABASE_URL` 未设置，系统应返回错误

### Requirement: PostgreSQL SQL Syntax
系统 SHALL 使用PostgreSQL标准SQL语法。

#### Scenario: 自增主键
- **WHEN** 创建表时需要自增主键
- **THEN** 系统应使用 `SERIAL PRIMARY KEY`
- **THEN** 系统不应使用 `INTEGER PRIMARY KEY AUTOINCREMENT`

#### Scenario: 时间戳类型
- **WHEN** 创建表时需要时间戳字段
- **THEN** 系统应使用 `TIMESTAMP`
- **THEN** 系统不应使用 `DATETIME`

#### Scenario: 布尔类型默认值
- **WHEN** 创建表时需要布尔字段
- **THEN** 系统应使用 `BOOLEAN DEFAULT FALSE` 或 `BOOLEAN DEFAULT TRUE`
- **THEN** 系统不应使用 `BOOLEAN DEFAULT 0` 或 `BOOLEAN DEFAULT 1`

#### Scenario: 当前时间戳
- **WHEN** 需要获取当前时间戳
- **THEN** 系统应使用 `CURRENT_TIMESTAMP`
- **THEN** 系统不应使用 `datetime('now')`

### Requirement: PostgreSQL Parameter Placeholders
系统 SHALL 使用PostgreSQL参数占位符。

#### Scenario: 参数化查询
- **WHEN** 执行参数化SQL查询时
- **THEN** 系统应使用 `$1, $2, $3...` 作为占位符
- **THEN** 系统不应使用 `?` 作为占位符

#### Scenario: 多参数查询
- **WHEN** 执行包含3个参数的查询时
- **THEN** 第一个参数应使用 `$1`
- **THEN** 第二个参数应使用 `$2`
- **THEN** 第三个参数应使用 `$3`

### Requirement: UPSERT Operations
系统 SHALL 使用PostgreSQL的ON CONFLICT语法实现UPSERT。

#### Scenario: INSERT OR REPLACE
- **WHEN** 需要插入或更新记录时
- **THEN** 系统应使用 `INSERT ... ON CONFLICT ... DO UPDATE SET ...`
- **THEN** 系统不应使用 `INSERT OR REPLACE`

#### Scenario: INSERT OR IGNORE
- **WHEN** 需要插入记录但忽略冲突时
- **THEN** 系统应使用 `INSERT ... ON CONFLICT DO NOTHING`
- **THEN** 系统不应使用 `INSERT OR IGNORE`

### Requirement: PostgreSQL Triggers
系统 SHALL 使用PostgreSQL触发器语法。

#### Scenario: 自动更新时间戳
- **WHEN** 记录更新时需要自动更新 `updated_at` 字段
- **THEN** 系统应创建PostgreSQL函数
- **THEN** 系统应创建BEFORE UPDATE触发器
- **THEN** 系统不应使用SQLite触发器语法

## MODIFIED Requirements

### Requirement: Database Initialization
系统 SHALL 简化数据库初始化逻辑。

#### Scenario: 单一数据库连接
- **WHEN** 系统启动时
- **THEN** 系统应只尝试连接PostgreSQL
- **THEN** 系统不应有条件分支选择数据库类型

#### Scenario: 连接失败处理
- **WHEN** 无法连接到PostgreSQL时
- **THEN** 系统应返回明确的错误信息
- **THEN** 系统应停止启动

### Requirement: Environment Configuration
系统 SHALL 简化环境变量配置。

#### Scenario: 必需的环境变量
- **WHEN** 系统启动时
- **THEN** 系统应要求 `DATABASE_URL` 环境变量
- **THEN** 系统不应要求 `USE_NEON` 环境变量
- **THEN** 系统不应要求 `SQLITE_PATH` 环境变量

## SQL Syntax Conversion Reference

### Table Creation

**Before (SQLite)**:
```sql
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT 0
)
```

**After (PostgreSQL)**:
```sql
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT FALSE
)
```

### INSERT OR REPLACE

**Before (SQLite)**:
```sql
INSERT OR REPLACE INTO system_config (key, value) 
VALUES (?, ?)
```

**After (PostgreSQL)**:
```sql
INSERT INTO system_config (key, value) 
VALUES ($1, $2) 
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
```

### INSERT OR IGNORE

**Before (SQLite)**:
```sql
INSERT OR IGNORE INTO ai_models (id, user_id, name, provider, enabled) 
VALUES (?, 'default', ?, ?, 0)
```

**After (PostgreSQL)**:
```sql
INSERT INTO ai_models (id, user_id, name, provider, enabled) 
VALUES ($1, 'default', $2, $3, FALSE) 
ON CONFLICT (id, user_id) DO NOTHING
```

### Triggers

**Before (SQLite)**:
```sql
CREATE TRIGGER update_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
```

**After (PostgreSQL)**:
```sql
-- 创建函数
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
```

## Testing Requirements

### Requirement: Comprehensive Testing
系统 SHALL 通过所有功能测试。

#### Scenario: API测试
- **WHEN** 运行API测试套件时
- **THEN** 所有用户认证测试应通过
- **THEN** 所有模型配置测试应通过
- **THEN** 所有交易所配置测试应通过
- **THEN** 所有交易员管理测试应通过

#### Scenario: 数据完整性测试
- **WHEN** 执行CRUD操作时
- **THEN** 数据应正确插入
- **THEN** 数据应正确更新
- **THEN** 数据应正确删除
- **THEN** 外键约束应正常工作

#### Scenario: 性能测试
- **WHEN** 执行常见查询时
- **THEN** 响应时间应与SQLite相当或更好
- **THEN** 并发查询应正常工作
