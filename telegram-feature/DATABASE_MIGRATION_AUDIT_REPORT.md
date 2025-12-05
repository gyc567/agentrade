# 数据库迁移审计报告 - SQLite到Neon PostgreSQL

## 📋 审计概览

**审计日期**: 2025-11-23  
**审计人员**: Kiro AI Assistant  
**迁移目标**: SQLite → Neon.tech (PostgreSQL)  
**审计结果**: ❌ **发现严重问题 - 迁移未完成**

## 🚨 关键发现

### 严重问题

1. **❌ 代码仍在使用SQLite驱动**
   - 文件: `config/database.go:17`
   - 问题: `_ "github.com/mattn/go-sqlite3"`
   - 影响: 无法连接到PostgreSQL数据库

2. **❌ 数据库连接使用SQLite语法**
   - 文件: `config/database.go:27`
   - 问题: `sql.Open("sqlite3", dbPath)`
   - 影响: 无法连接到Neon数据库

3. **❌ 大量SQLite特定语法**
   - `AUTOINCREMENT` (PostgreSQL使用`SERIAL`)
   - `INTEGER PRIMARY KEY` (PostgreSQL使用`SERIAL PRIMARY KEY`)
   - `INSERT OR REPLACE` (PostgreSQL使用`INSERT ... ON CONFLICT`)
   - `INSERT OR IGNORE` (PostgreSQL使用`INSERT ... ON CONFLICT DO NOTHING`)
   - `DATETIME` (PostgreSQL使用`TIMESTAMP`)
   - `BOOLEAN` (PostgreSQL使用`BOOLEAN`，但默认值语法不同)

## 📊 详细问题清单

### 1. 导入和驱动问题

#### 当前代码 (config/database.go:17)
```go
_ "github.com/mattn/go-sqlite3"
```

#### 应该改为
```go
_ "github.com/lib/pq"
```

### 2. 数据库连接问题

#### 当前代码 (config/database.go:27)
```go
func NewDatabase(dbPath string) (*Database, error) {
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        return nil, fmt.Errorf("打开数据库失败: %w", err)
    }
    // ...
}
```

#### 应该改为
```go
func NewDatabase(dbPath string) (*Database, error) {
    // 检查是否使用Neon
    useNeon := os.Getenv("USE_NEON") == "true"
    var db *sql.DB
    var err error
    
    if useNeon {
        // 使用PostgreSQL (Neon)
        databaseURL := os.Getenv("DATABASE_URL")
        if databaseURL == "" {
            return nil, fmt.Errorf("DATABASE_URL环境变量未设置")
        }
        db, err = sql.Open("postgres", databaseURL)
    } else {
        // 使用SQLite (本地开发)
        db, err = sql.Open("sqlite3", dbPath)
    }
    
    if err != nil {
        return nil, fmt.Errorf("打开数据库失败: %w", err)
    }
    // ...
}
```

### 3. SQL语法兼容性问题

#### 问题1: AUTOINCREMENT

**位置**: `config/database.go:89`

**当前代码**:
```sql
CREATE TABLE IF NOT EXISTS user_signal_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    -- ...
)
```

**PostgreSQL版本**:
```sql
CREATE TABLE IF NOT EXISTS user_signal_sources (
    id SERIAL PRIMARY KEY,
    -- ...
)
```

#### 问题2: INTEGER PRIMARY KEY

**位置**: 多处表定义

**当前代码**:
```sql
id INTEGER PRIMARY KEY AUTOINCREMENT
```

**PostgreSQL版本**:
```sql
id SERIAL PRIMARY KEY
```

#### 问题3: DATETIME类型

**位置**: 所有表定义

**当前代码**:
```sql
created_at DATETIME DEFAULT CURRENT_TIMESTAMP
```

**PostgreSQL版本**:
```sql
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### 问题4: BOOLEAN默认值

**当前代码**:
```sql
enabled BOOLEAN DEFAULT 0
```

**PostgreSQL版本**:
```sql
enabled BOOLEAN DEFAULT FALSE
```

#### 问题5: INSERT OR REPLACE

**位置**: `config/database.go:1178, 1186`

**当前代码**:
```go
INSERT OR REPLACE INTO system_config (key, value) VALUES (?, ?)
```

**PostgreSQL版本**:
```go
INSERT INTO system_config (key, value) 
VALUES ($1, $2) 
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
```

#### 问题6: INSERT OR IGNORE

**位置**: `config/database.go:335, 355, 380, 1033, 1042, 1276`

**当前代码**:
```go
INSERT OR IGNORE INTO ai_models (id, user_id, name, provider, enabled) 
VALUES (?, 'default', ?, ?, 0)
```

**PostgreSQL版本**:
```go
INSERT INTO ai_models (id, user_id, name, provider, enabled) 
VALUES ($1, 'default', $2, $3, FALSE) 
ON CONFLICT (id, user_id) DO NOTHING
```

#### 问题7: 参数占位符

**当前代码**: 使用 `?`
**PostgreSQL**: 使用 `$1, $2, $3...`

**示例**:
```go
// SQLite
db.Exec("INSERT INTO users (name, email) VALUES (?, ?)", name, email)

// PostgreSQL
db.Exec("INSERT INTO users (name, email) VALUES ($1, $2)", name, email)
```

### 4. 触发器语法问题

**位置**: `config/database.go:215-220`

**当前代码**:
```sql
CREATE TRIGGER IF NOT EXISTS update_user_signal_sources_updated_at
    AFTER UPDATE ON user_signal_sources
    FOR EACH ROW
    BEGIN
        UPDATE user_signal_sources SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END
```

**PostgreSQL版本**:
```sql
CREATE OR REPLACE FUNCTION update_user_signal_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_signal_sources_updated_at
    BEFORE UPDATE ON user_signal_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_user_signal_sources_updated_at();
```

### 5. 外键约束问题

**当前代码**:
```sql
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
```

**PostgreSQL**: 语法相同，但需要确保引用的表已存在

## 📈 影响评估

### 受影响的功能

| 功能 | 影响程度 | 说明 |
|------|---------|------|
| 数据库连接 | 🔴 严重 | 无法连接到Neon数据库 |
| 表创建 | 🔴 严重 | SQL语法不兼容 |
| 数据插入 | 🔴 严重 | INSERT语法不兼容 |
| 数据更新 | 🟡 中等 | 参数占位符不兼容 |
| 数据查询 | 🟡 中等 | 参数占位符不兼容 |
| 触发器 | 🔴 严重 | 语法完全不同 |
| 自增ID | 🔴 严重 | AUTOINCREMENT不支持 |

### 受影响的文件

1. **config/database.go** - 核心数据库文件
   - 需要完全重写数据库初始化逻辑
   - 需要修改所有SQL语句
   - 需要修改所有参数占位符

2. **main.go** - 数据库初始化调用
   - 需要添加环境变量检查
   - 需要支持双数据库模式

## 🔧 修复方案

### 方案1: 完全迁移到PostgreSQL (推荐)

**优点**:
- 生产环境使用云数据库
- 更好的性能和可扩展性
- 支持更多并发连接

**缺点**:
- 需要大量代码修改
- 本地开发需要PostgreSQL

**实施步骤**:
1. 修改导入语句
2. 重写数据库连接逻辑
3. 转换所有SQL语句
4. 修改所有参数占位符
5. 重写触发器
6. 全面测试

### 方案2: 双数据库支持 (灵活)

**优点**:
- 本地开发使用SQLite
- 生产环境使用PostgreSQL
- 向后兼容

**缺点**:
- 需要维护两套SQL语句
- 代码复杂度增加

**实施步骤**:
1. 创建数据库抽象层
2. 实现SQLite和PostgreSQL两个驱动
3. 根据环境变量选择驱动
4. 测试两种模式

### 方案3: 使用ORM (长期方案)

**优点**:
- 数据库无关
- 自动处理SQL差异
- 类型安全

**缺点**:
- 需要重构大量代码
- 学习曲线
- 性能开销

**推荐ORM**:
- GORM
- sqlx
- ent

## 📝 详细修复代码

### 1. 修改导入语句

```go
package config

import (
    "crypto/rand"
    "database/sql"
    "encoding/base32"
    "encoding/json"
    "fmt"
    "log"
    "nofx/market"
    "os"
    "slices"
    "strings"
    "time"

    "github.com/google/uuid"
    _ "github.com/lib/pq"          // PostgreSQL驱动
    _ "github.com/mattn/go-sqlite3" // SQLite驱动（本地开发）
)
```

### 2. 修改数据库连接

```go
// Database 配置数据库
type Database struct {
    db     *sql.DB
    driver string // "postgres" or "sqlite3"
}

// NewDatabase 创建配置数据库
func NewDatabase(dbPath string) (*Database, error) {
    useNeon := os.Getenv("USE_NEON") == "true"
    var db *sql.DB
    var err error
    var driver string
    
    if useNeon {
        // 使用PostgreSQL (Neon)
        databaseURL := os.Getenv("DATABASE_URL")
        if databaseURL == "" {
            return nil, fmt.Errorf("DATABASE_URL环境变量未设置")
        }
        log.Printf("📊 连接到Neon PostgreSQL数据库")
        db, err = sql.Open("postgres", databaseURL)
        driver = "postgres"
    } else {
        // 使用SQLite (本地开发)
        log.Printf("📊 使用本地SQLite数据库: %s", dbPath)
        db, err = sql.Open("sqlite3", dbPath)
        driver = "sqlite3"
    }
    
    if err != nil {
        return nil, fmt.Errorf("打开数据库失败: %w", err)
    }

    // 测试连接
    if err := db.Ping(); err != nil {
        return nil, fmt.Errorf("数据库连接测试失败: %w", err)
    }

    database := &Database{
        db:     db,
        driver: driver,
    }
    
    if err := database.createTables(); err != nil {
        return nil, fmt.Errorf("创建表失败: %w", err)
    }

    // 为现有数据库添加新字段（向后兼容）
    if err := database.alterTables(); err != nil {
        log.Printf("⚠️ 数据库迁移警告: %v", err)
    }

    if err := database.initDefaultData(); err != nil {
        return nil, fmt.Errorf("初始化默认数据失败: %w", err)
    }

    return database, nil
}
```

### 3. 创建SQL生成辅助函数

```go
// getPlaceholder 获取参数占位符
func (d *Database) getPlaceholder(index int) string {
    if d.driver == "postgres" {
        return fmt.Sprintf("$%d", index)
    }
    return "?"
}

// getAutoIncrement 获取自增语法
func (d *Database) getAutoIncrement() string {
    if d.driver == "postgres" {
        return "SERIAL PRIMARY KEY"
    }
    return "INTEGER PRIMARY KEY AUTOINCREMENT"
}

// getDateTimeType 获取日期时间类型
func (d *Database) getDateTimeType() string {
    if d.driver == "postgres" {
        return "TIMESTAMP"
    }
    return "DATETIME"
}

// getBooleanDefault 获取布尔默认值
func (d *Database) getBooleanDefault(value bool) string {
    if d.driver == "postgres" {
        if value {
            return "TRUE"
        }
        return "FALSE"
    }
    if value {
        return "1"
    }
    return "0"
}

// getInsertOrReplace 获取INSERT OR REPLACE语法
func (d *Database) getInsertOrReplace(table string, columns []string, conflictColumns []string) string {
    if d.driver == "postgres" {
        // PostgreSQL: INSERT ... ON CONFLICT ... DO UPDATE
        updateSet := make([]string, 0, len(columns))
        for _, col := range columns {
            if !contains(conflictColumns, col) {
                updateSet = append(updateSet, fmt.Sprintf("%s = EXCLUDED.%s", col, col))
            }
        }
        return fmt.Sprintf(
            "INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO UPDATE SET %s",
            table,
            strings.Join(columns, ", "),
            d.getPlaceholders(len(columns)),
            strings.Join(conflictColumns, ", "),
            strings.Join(updateSet, ", "),
        )
    }
    // SQLite: INSERT OR REPLACE
    return fmt.Sprintf(
        "INSERT OR REPLACE INTO %s (%s) VALUES (%s)",
        table,
        strings.Join(columns, ", "),
        d.getPlaceholders(len(columns)),
    )
}

// getInsertOrIgnore 获取INSERT OR IGNORE语法
func (d *Database) getInsertOrIgnore(table string, columns []string, conflictColumns []string) string {
    if d.driver == "postgres" {
        // PostgreSQL: INSERT ... ON CONFLICT ... DO NOTHING
        return fmt.Sprintf(
            "INSERT INTO %s (%s) VALUES (%s) ON CONFLICT (%s) DO NOTHING",
            table,
            strings.Join(columns, ", "),
            d.getPlaceholders(len(columns)),
            strings.Join(conflictColumns, ", "),
        )
    }
    // SQLite: INSERT OR IGNORE
    return fmt.Sprintf(
        "INSERT OR IGNORE INTO %s (%s) VALUES (%s)",
        table,
        strings.Join(columns, ", "),
        d.getPlaceholders(len(columns)),
    )
}

// getPlaceholders 生成多个占位符
func (d *Database) getPlaceholders(count int) string {
    placeholders := make([]string, count)
    for i := 0; i < count; i++ {
        placeholders[i] = d.getPlaceholder(i + 1)
    }
    return strings.Join(placeholders, ", ")
}

// contains 检查字符串数组是否包含某个值
func contains(arr []string, str string) bool {
    for _, a := range arr {
        if a == str {
            return true
        }
    }
    return false
}
```

### 4. 修改表创建语句示例

```go
func (d *Database) createTables() error {
    // 用户信号源配置表
    userSignalSourcesTable := fmt.Sprintf(`
        CREATE TABLE IF NOT EXISTS user_signal_sources (
            id %s,
            user_id TEXT NOT NULL,
            coin_pool_url TEXT DEFAULT '',
            oi_top_url TEXT DEFAULT '',
            created_at %s DEFAULT CURRENT_TIMESTAMP,
            updated_at %s DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id)
        )
    `, d.getAutoIncrement(), d.getDateTimeType(), d.getDateTimeType())

    queries := []string{
        userSignalSourcesTable,
        // ... 其他表
    }

    for _, query := range queries {
        if _, err := d.db.Exec(query); err != nil {
            return fmt.Errorf("执行SQL失败: %w\nSQL: %s", err, query)
        }
    }

    return nil
}
```

### 5. 修改INSERT语句示例

```go
// CreateUserSignalSource 创建用户信号源配置
func (d *Database) CreateUserSignalSource(userID, coinPoolURL, oiTopURL string) error {
    if d.driver == "postgres" {
        _, err := d.db.Exec(`
            INSERT INTO user_signal_sources (user_id, coin_pool_url, oi_top_url, updated_at)
            VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id) DO UPDATE SET 
                coin_pool_url = EXCLUDED.coin_pool_url,
                oi_top_url = EXCLUDED.oi_top_url,
                updated_at = CURRENT_TIMESTAMP
        `, userID, coinPoolURL, oiTopURL)
        return err
    }
    
    // SQLite
    _, err := d.db.Exec(`
        INSERT OR REPLACE INTO user_signal_sources (user_id, coin_pool_url, oi_top_url, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `, userID, coinPoolURL, oiTopURL)
    return err
}
```

## 🧪 测试计划

### 1. 单元测试

```go
func TestDatabaseConnection(t *testing.T) {
    // 测试SQLite连接
    os.Setenv("USE_NEON", "false")
    db, err := NewDatabase("test.db")
    assert.NoError(t, err)
    assert.NotNil(t, db)
    
    // 测试PostgreSQL连接
    os.Setenv("USE_NEON", "true")
    os.Setenv("DATABASE_URL", "postgres://...")
    db, err = NewDatabase("")
    assert.NoError(t, err)
    assert.NotNil(t, db)
}

func TestSQLCompatibility(t *testing.T) {
    // 测试SQL语句在两种数据库中都能正常工作
    // ...
}
```

### 2. 集成测试

- 测试所有CRUD操作
- 测试外键约束
- 测试触发器
- 测试并发访问

### 3. 迁移测试

- 从SQLite导出数据
- 导入到PostgreSQL
- 验证数据完整性

## 📊 迁移时间估算

| 任务 | 预计时间 | 优先级 |
|------|---------|--------|
| 修改数据库连接逻辑 | 2小时 | P0 |
| 转换所有SQL语句 | 8小时 | P0 |
| 修改参数占位符 | 4小时 | P0 |
| 重写触发器 | 2小时 | P1 |
| 编写测试 | 4小时 | P0 |
| 数据迁移 | 2小时 | P1 |
| 文档更新 | 2小时 | P2 |
| **总计** | **24小时** | - |

## 🎯 建议

### 立即执行 (P0)

1. **修改数据库连接逻辑**
   - 支持环境变量切换
   - 添加PostgreSQL驱动

2. **创建SQL兼容层**
   - 实现辅助函数
   - 统一SQL生成

3. **修改核心SQL语句**
   - 表创建语句
   - INSERT/UPDATE语句
   - 参数占位符

### 短期优化 (P1)

4. **重写触发器**
   - 转换为PostgreSQL函数

5. **数据迁移工具**
   - 编写迁移脚本
   - 验证数据完整性

### 长期规划 (P2)

6. **考虑使用ORM**
   - 评估GORM等ORM框架
   - 逐步重构代码

7. **性能优化**
   - 添加索引
   - 优化查询

## 📚 参考资料

- [PostgreSQL vs SQLite语法差异](https://www.postgresql.org/docs/current/sql.html)
- [lib/pq文档](https://github.com/lib/pq)
- [Neon.tech文档](https://neon.tech/docs)
- [SQL迁移最佳实践](https://www.postgresql.org/docs/current/migration.html)

## 🎊 总结

### 当前状态

- ❌ 代码仍在使用SQLite
- ❌ 无法连接到Neon数据库
- ❌ SQL语法不兼容
- ⚠️ 需要大量代码修改

### 推荐行动

1. **立即**: 实施方案2（双数据库支持）
2. **短期**: 完成所有SQL语句转换
3. **长期**: 考虑迁移到ORM

### 风险评估

- **高风险**: 直接修改可能导致数据丢失
- **建议**: 先在测试环境验证
- **备份**: 迁移前务必备份数据

---

**审计状态**: ❌ 发现严重问题  
**推荐操作**: 立即开始迁移工作  
**预计工作量**: 3个工作日
