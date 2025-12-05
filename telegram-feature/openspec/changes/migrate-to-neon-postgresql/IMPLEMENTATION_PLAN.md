# PostgreSQL迁移实施计划

## 📋 概览

**目标**: 完全移除SQLite支持，只使用Neon PostgreSQL  
**预计时间**: 8小时  
**风险等级**: 高  

## 🎯 实施策略

由于这是一个高风险的大型迁移，我们采用**分步实施、逐步验证**的策略：

### 策略1: 最小化风险
1. 先修改数据库连接逻辑
2. 然后转换SQL语法
3. 最后清理代码

### 策略2: 持续测试
每个步骤完成后立即测试，确保功能正常

### 策略3: 可回滚
保持Git提交清晰，便于回滚

## 📊 详细步骤

### Step 1: 修改数据库连接 (1小时)

**目标**: 移除SQLite连接，只保留PostgreSQL

**文件**: `config/database.go`

**修改内容**:
1. 移除 `_ "github.com/mattn/go-sqlite3"` 导入
2. 移除 `usingNeon` 字段
3. 简化 `NewDatabase` 函数
4. 移除 `USE_NEON` 环境变量检查

**测试**: 编译通过，连接Neon成功

### Step 2: 转换表创建语句 (2小时)

**目标**: 所有CREATE TABLE语句使用PostgreSQL语法

**修改内容**:
1. `AUTOINCREMENT` → `SERIAL`
2. `INTEGER PRIMARY KEY` → `SERIAL PRIMARY KEY`  
3. `DATETIME` → `TIMESTAMP`
4. `BOOLEAN DEFAULT 0/1` → `BOOLEAN DEFAULT FALSE/TRUE`

**测试**: 表创建成功

### Step 3: 转换INSERT语句 (2小时)

**目标**: 所有INSERT语句使用PostgreSQL语法

**修改内容**:
1. `INSERT OR REPLACE` → `INSERT ... ON CONFLICT ... DO UPDATE`
2. `INSERT OR IGNORE` → `INSERT ... ON CONFLICT DO NOTHING`

**测试**: 数据插入成功

### Step 4: 转换参数占位符 (2小时)

**目标**: 所有SQL参数使用PostgreSQL占位符

**修改内容**:
1. 所有 `?` → `$1, $2, $3...`
2. 修改所有 `Exec` 调用
3. 修改所有 `Query` 调用
4. 修改所有 `QueryRow` 调用

**测试**: 所有查询正常

### Step 5: 重写触发器 (30分钟)

**目标**: 使用PostgreSQL触发器语法

**修改内容**:
1. 创建PostgreSQL函数
2. 创建PostgreSQL触发器

**测试**: 触发器正常工作

### Step 6: 清理代码 (30分钟)

**目标**: 移除所有SQLite相关代码

**修改内容**:
1. 移除兼容性函数
2. 移除条件分支
3. 简化代码逻辑

**测试**: 编译通过，功能正常

## 🔧 关键代码修改

### 1. 数据库连接

**当前代码** (`config/database.go`):
```go
func NewDatabase(dbPath string) (*Database, error) {
    useNeon := os.Getenv("USE_NEON") == "true"
    var db *sql.DB
    var err error
    var usingNeon bool
    
    if useNeon {
        databaseURL := os.Getenv("DATABASE_URL")
        if databaseURL != "" {
            db, err = sql.Open("postgres", databaseURL)
            usingNeon = true
        }
    }
    
    if db == nil {
        db, err = sql.Open("sqlite3", dbPath)
        usingNeon = false
    }
    // ...
}
```

**修改后**:
```go
func NewDatabase() (*Database, error) {
    databaseURL := os.Getenv("DATABASE_URL")
    if databaseURL == "" {
        return nil, fmt.Errorf("DATABASE_URL环境变量未设置")
    }
    
    db, err := sql.Open("postgres", databaseURL)
    if err != nil {
        return nil, fmt.Errorf("打开数据库失败: %w", err)
    }
    
    if err := db.Ping(); err != nil {
        return nil, fmt.Errorf("连接数据库失败: %w", err)
    }
    
    database := &Database{db: db}
    // ...
}
```

### 2. 表创建示例

**当前代码**:
```sql
CREATE TABLE IF NOT EXISTS user_signal_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT 0
)
```

**修改后**:
```sql
CREATE TABLE IF NOT EXISTS user_signal_sources (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    enabled BOOLEAN DEFAULT FALSE
)
```

### 3. INSERT OR REPLACE示例

**当前代码**:
```go
_, err := d.db.Exec(`
    INSERT OR REPLACE INTO system_config (key, value) 
    VALUES (?, ?)
`, key, value)
```

**修改后**:
```go
_, err := d.db.Exec(`
    INSERT INTO system_config (key, value) 
    VALUES ($1, $2) 
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
`, key, value)
```

### 4. 参数占位符转换

需要转换的模式：
- `VALUES (?, ?)` → `VALUES ($1, $2)`
- `WHERE id = ?` → `WHERE id = $1`
- `SET name = ?, email = ?` → `SET name = $1, email = $2`

**工具函数**（临时使用，转换完成后删除）:
```go
// 生成PostgreSQL占位符
func pgPlaceholders(count int) string {
    placeholders := make([]string, count)
    for i := 0; i < count; i++ {
        placeholders[i] = fmt.Sprintf("$%d", i+1)
    }
    return strings.Join(placeholders, ", ")
}
```

## 🧪 测试计划

### 测试1: 数据库连接
```bash
# 设置环境变量
export DATABASE_URL='postgresql://...'

# 运行程序
go run main.go

# 预期: 成功连接到Neon
```

### 测试2: 表创建
```bash
# 检查所有表是否创建成功
# 预期: 所有表创建成功，无错误
```

### 测试3: API测试
```bash
# 运行API测试脚本
./test-backend-api.sh

# 预期: 所有测试通过
```

### 测试4: 功能测试
- 用户注册 ✓
- 用户登录 ✓
- 模型配置 ✓
- 交易所配置 ✓
- 交易员管理 ✓
- 信号源配置 ✓

## ⚠️ 风险和缓解措施

### 风险1: SQL语法错误
**影响**: 功能失效  
**概率**: 中  
**缓解**: 
- 仔细检查每个SQL语句
- 逐步测试
- 使用PostgreSQL文档验证语法

### 风险2: 参数占位符遗漏
**影响**: 查询失败  
**概率**: 高  
**缓解**:
- 使用grep搜索所有 `?`
- 逐个检查和修改
- 编译时会报错

### 风险3: 数据类型不兼容
**影响**: 数据错误  
**概率**: 低  
**缓解**:
- PostgreSQL类型更严格，更安全
- 测试所有CRUD操作

### 风险4: 触发器不工作
**影响**: 自动更新失效  
**概率**: 中  
**缓解**:
- 测试触发器功能
- 验证updated_at字段更新

## 📝 检查清单

### 代码修改
- [ ] 移除SQLite导入
- [ ] 简化数据库连接
- [ ] 转换所有CREATE TABLE
- [ ] 转换所有INSERT OR REPLACE
- [ ] 转换所有INSERT OR IGNORE
- [ ] 转换所有参数占位符
- [ ] 重写所有触发器
- [ ] 移除兼容性代码

### 测试
- [ ] 编译通过
- [ ] 连接Neon成功
- [ ] 表创建成功
- [ ] 数据插入成功
- [ ] 数据查询成功
- [ ] 数据更新成功
- [ ] 数据删除成功
- [ ] 触发器工作正常
- [ ] 所有API测试通过

### 文档
- [ ] 更新README
- [ ] 更新.env.example
- [ ] 创建迁移报告
- [ ] 更新部署文档

### 部署
- [ ] 更新环境变量
- [ ] 部署到生产环境
- [ ] 验证功能
- [ ] 监控日志

## 🎯 成功标准

1. ✅ 代码中无SQLite引用
2. ✅ go.mod中无SQLite依赖
3. ✅ 所有API测试通过
4. ✅ 所有功能正常工作
5. ✅ 性能无明显下降
6. ✅ 无错误日志

## 📚 参考资料

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [lib/pq文档](https://github.com/lib/pq)
- [Neon文档](https://neon.tech/docs)
- [SQLite到PostgreSQL迁移指南](https://www.postgresql.org/docs/current/migration.html)

---

**状态**: 📝 计划完成，准备实施  
**下一步**: 开始Step 1 - 修改数据库连接逻辑
