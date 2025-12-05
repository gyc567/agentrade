# 数据库操作最佳实践

## 📋 文档信息
- **文档版本**: v1.0
- **创建日期**: 2025-11-25
- **最后更新**: 2025-11-25
- **维护者**: 开发团队
- **批准状态**: 待批准

## 🎯 目的

本文档旨在建立统一、清晰、可执行的数据库操作规范，特别是时间戳字段的管理，以防止类似BUG-2025-1125-001和BUG-2025-1125-002的问题再次发生。

## 📚 核心原则

### 1. 信任数据库专业能力
> "让数据库做它最擅长的事"

数据库是时间戳管理的专家，我们应该信任并使用其内置机制，而不是重复造轮子。

### 2. Linus Torvalds的"好品味"原则
> "有时你可以从不同角度看问题，重写它让特殊情况消失，变成正常情况。"

消除复杂性，让代码自然流畅。

### 3. DRY原则（Don't Repeat Yourself）
不要重复管理应由数据库自动处理的字段。

### 4. 一致性优于约定俗成
统一的模式比多个不同的实现方式更易于理解和维护。

## ⏰ 时间戳管理规范

### 字段命名约定
- **创建时间**: `created_at`
- **更新时间**: `updated_at`
- **删除时间**: `deleted_at`（软删除场景）

### 类型规范
- **SQLite**: `DATETIME DEFAULT CURRENT_TIMESTAMP`
- **PostgreSQL**: `TIMESTAMP DEFAULT CURRENT_TIMESTAMP`

### 核心规则

#### ✅ 允许的操作

```go
// 1. 在UPDATE语句中明确设置updated_at
_, err := db.Exec(`
    UPDATE table_name
    SET field = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
`, value, id)

// 2. 使用数据库触发器自动更新（推荐）
CREATE TRIGGER update_table_updated_at
    AFTER UPDATE ON table_name
    BEGIN
        UPDATE table_name SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END

// 3. 让数据库自动管理（推荐用于INSERT）
INSERT INTO table_name (field1, field2)
VALUES (?, ?)
// 数据库自动设置created_at和updated_at
```

#### ❌ 禁止的操作

```go
// 1. 禁止在INSERT语句中手动指定时间戳
INSERT INTO table_name (field1, field2, created_at, updated_at)
VALUES (?, ?, datetime('now'), datetime('now'))  // ❌ 错误

// 2. 禁止手动计算时间戳
now := time.Now()
INSERT INTO table_name (field1, created_at)
VALUES (?, ?)  // ❌ 错误：now应该是数据库设置的
```

## 📝 INSERT操作规范

### 场景1: 纯INSERT（创建新记录）

```go
// ✅ 正确做法
_, err := db.Exec(`
    INSERT INTO table_name (id, user_id, name, field1)
    VALUES (?, ?, ?, ?)
`, id, userID, name, field1)
// 数据库自动设置created_at和updated_at
```

### 场景2: INSERT ... ON CONFLICT（UPSERT）

```go
// ✅ 正确做法：让数据库自动管理两个时间戳
_, err := db.Exec(`
    INSERT INTO table_name (id, user_id, name, field1)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, field1 = EXCLUDED.field1
    // updated_at由触发器自动设置
`)

// ⚠️ 特殊情况：如果没有触发器，可以手动设置updated_at
_, err := db.Exec(`
    INSERT INTO table_name (id, user_id, name, field1)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (id) DO UPDATE
    SET name = EXCLUDED.name, field1 = EXCLUDED.field1, updated_at = CURRENT_TIMESTAMP
`, id, userID, name, field1)
```

### 场景3: INSERT OR REPLACE（SQLite特有）

```go
// ⚠️ 注意：OR REPLACE会先删除再插入，不会有触发器
// ✅ 正确做法：手动设置时间戳（唯一需要手动的情况）
_, err := db.Exec(`
    INSERT OR REPLACE INTO table_name (id, user_id, name, created_at, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
`, id, userID, name)
```

## 🔄 UPDATE操作规范

```go
// ✅ 推荐做法：使用触发器自动更新
// 触发器会自动处理updated_at

// ✅ 或者：显式设置updated_at
_, err := db.Exec(`
    UPDATE table_name
    SET name = ?, field1 = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
`, name, field1, id)
```

## 🗃️ 数据库表设计规范

### 创建表时的时间戳字段

```sql
-- ✅ SQLite
CREATE TABLE table_name (
    id TEXT PRIMARY KEY,
    field1 TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ✅ PostgreSQL
CREATE TABLE table_name (
    id TEXT PRIMARY KEY,
    field1 TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 触发器设计

```sql
-- ✅ 自动更新updated_at的触发器
CREATE TRIGGER IF NOT EXISTS update_table_name_updated_at
    AFTER UPDATE ON table_name
    BEGIN
        UPDATE table_name SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
```

## 🚫 常见陷阱与解决方案

### 陷阱1: 在INSERT中手动指定时间戳

**错误示例**:
```go
INSERT INTO table_name (field, created_at, updated_at)
VALUES (?, datetime('now'), datetime('now'))  // ❌
```

**正确示例**:
```go
INSERT INTO table_name (field)  // ✅
VALUES (?)
```

### 陷阱2: 混合使用手动和自动管理

**错误示例**:
```go
INSERT INTO table_name (field1, created_at, updated_at)
VALUES (?, CURRENT_TIMESTAMP, ?)  // ❌ 一半自动一半手动
```

**正确示例**:
```go
INSERT INTO table_name (field1)  // ✅ 全自动
VALUES (?)
```

### 陷阱3: 在应用层计算时间戳

**错误示例**:
```go
now := time.Now()
INSERT INTO table_name (field, created_at)
VALUES (?, now)  // ❌ 应用层时间戳
```

**正确示例**:
```go
INSERT INTO table_name (field)  // ✅ 数据库时间戳
VALUES (?)
```

## 🔍 代码审查清单

### INSERT语句审查
- [ ] 是否手动指定了 `created_at` 或 `updated_at` 字段？
- [ ] 是否应该让数据库自动管理？
- [ ] 字段列表与值列表是否匹配？
- [ ] 是否遵循了项目的命名约定？

### UPDATE语句审查
- [ ] 是否设置了 `updated_at` 字段？
- [ ] 是否使用了触发器？
- [ ] 是否在WHERE条件中正确使用了主键？

### 表结构审查
- [ ] 时间戳字段是否有默认值？
- [ ] 是否有自动更新 `updated_at` 的触发器？
- [ ] 时间戳字段的类型是否正确？

## 📊 已修复的Bug

### BUG-2025-1125-001: AI模型配置
- **位置**: `UpdateAIModel` 函数 (config/database.go:1167-1170)
- **问题**: INSERT语句手动指定时间戳
- **修复**: 移除 `created_at` 和 `updated_at` 字段
- **参数变化**: 9 → 8

### BUG-2025-1125-002: 交易所配置
- **位置**: `UpdateExchange` 函数 (config/database.go:1263-1267)
- **问题**: INSERT语句手动指定时间戳
- **修复**: 移除 `created_at` 和 `updated_at` 字段
- **参数变化**: 14 → 13

## 🔍 代码扫描命令

### 搜索手动时间戳指定
```bash
# 搜索包含datetime('now')的INSERT语句
grep -rn "INSERT INTO" --include="*.go" . | grep -E "(created_at|updated_at)" | grep "VALUES"

# 搜索CURRENT_TIMESTAMP在INSERT中的使用
grep -rn "INSERT INTO" --include="*.go" . | grep -E "CURRENT_TIMESTAMP"
```

### 搜索触发器
```bash
# 搜索触发器定义
grep -rn "CREATE TRIGGER" --include="*.go" .

# 搜索自动更新触发器
grep -rn "update.*updated_at" --include="*.go" .
```

## 📚 参考资料

- [SQLite时间戳文档](https://sqlite.org/lang_createtable.html#dflt2022)
- [PostgreSQL时间戳文档](https://www.postgresql.org/docs/current/datatype-datetime.html)
- [Go数据库最佳实践](https://golang.org/doc/databasebestpractices)
- [Linus Torvalds的编程哲学](https://en.wikipedia.org/wiki/Linus_Torvalds)

## 📝 实施计划

### 阶段1: 现有代码审计
- [ ] 搜索所有手动指定时间戳的INSERT语句
- [ ] 修复发现的问题
- [ ] 更新触发器（如果缺失）

### 阶段2: 建立规范
- [ ] 批准本文档
- [ ] 更新开发手册
- [ ] 添加代码审查清单

### 阶段3: 测试覆盖
- [ ] 为所有数据库写入操作添加单元测试
- [ ] 测试时间戳字段的正确性
- [ ] 确保向后兼容性

### 阶段4: 持续改进
- [ ] 定期审查新代码
- [ ] 更新最佳实践文档
- [ ] 收集反馈并改进

## 👥 责任分工

- **文档维护**: 开发团队
- **代码审查**: 高级工程师
- **实施检查**: 技术负责人
- **培训**: 架构师

## ✅ 批准签字

| 角色 | 姓名 | 签字 | 日期 |
|------|------|------|------|
| 技术负责人 | | | |
| 架构师 | | | |
| 开发团队负责人 | | | |

---

**注意**: 本文档是活文档，应根据实际使用情况和反馈持续更新。
